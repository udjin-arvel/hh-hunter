import { create } from "zustand";

import { GENERATION_CANCELLED_MESSAGE } from "./api/deepseek";
import { toAppError } from "./errors";
import { getDisplayLetter, validateGenerationInput } from "./generation";
import {
  getVacancyReplyUrl,
  isHhVacancyUrl,
  normalizeHhVacancyUrl,
  parseHhVacancyId,
} from "./hh-url";
import {
  cancelGenerationRequest,
  fetchVacancyById,
  generateLetterFromContext,
  getErrorMessage,
  importPortfolioFromUrl,
} from "./messaging";
import { buildGenerationRequest as createGenerationRequest } from "./prompts";
import { getProfilePreviewText, truncatePreview, validatePortfolioUrl } from "./profile";
import { ensureOriginPermission } from "./portfolio-import";
import {
  loadPersistedState,
  saveActiveTab,
  saveProfile as persistProfile,
  saveSettings as persistSettings,
} from "./storage";
import {
  DEFAULT_PERSISTED_STATE,
  type GenerationRequest,
  type GenerationResult,
  type GenerationSettings,
  type GenerationStage,
  type Profile,
  type TabKey,
  type Vacancy,
} from "./types";
import type { PersistedState } from "./types";

interface AppState {
  isHydrated: boolean;
  isSaving: boolean;
  isImportingPortfolio: boolean;
  activeTab: TabKey;
  saveError: string | null;
  portfolioImportError: string | null;
  portfolioImportSuccess: boolean;
  profileUrlError: string | null;
  profilePreview: string | null;
  profile: Profile;
  settings: GenerationSettings;
  vacancy: Vacancy | null;
  activeTabUrl: string | null;
  isHhVacancyTab: boolean;
  manualVacancyUrl: string;
  isFetchingVacancy: boolean;
  vacancyError: string | null;
  generationInputError: string | null;
  generationResult: GenerationResult | null;
  isGenerating: boolean;
  generationError: string | null;
  generationStage: GenerationStage;
  letterDraft: string | null;
  copyFeedback: "success" | "error" | null;
  generationStartedAt: number | null;
  generationDurationMs: number | null;
  hydrate: (data: PersistedState) => void;
  setActiveTab: (tab: TabKey) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => void;
  updateSettings: (patch: Partial<GenerationSettings>) => void;
  importPortfolio: () => Promise<void>;
  clearProfilePreview: () => void;
  setManualVacancyUrl: (url: string) => void;
  refreshActiveTabInfo: () => Promise<void>;
  scanActiveTab: () => Promise<void>;
  importVacancyFromUrl: (url?: string) => Promise<void>;
  clearVacancy: () => void;
  checkGenerationReadiness: () => void;
  buildGenerationRequest: () => GenerationRequest | null;
  generateLetter: () => Promise<void>;
  regenerateLetter: () => Promise<void>;
  cancelGeneration: () => void;
  openVacancyReply: () => void;
  updateLetterDraft: (text: string) => void;
  copyLetterToClipboard: () => Promise<void>;
  clearGenerationResult: () => void;
  saveProfile: () => Promise<void>;
  clearProfile: () => Promise<void>;
  saveSettings: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

function buildProfilePreview(profile: Profile): string | null {
  const previewSource = getProfilePreviewText(profile);
  return previewSource ? truncatePreview(previewSource) : null;
}

function resolveGenerationInputError(
  profile: Profile,
  vacancy: Vacancy | null,
  settings: GenerationSettings,
): string | null {
  const result = validateGenerationInput(profile, vacancy, settings);
  return result.ok ? null : result.error.message;
}

let copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

export const useAppStore = create<AppState>((set, get) => ({
  isHydrated: false,
  isSaving: false,
  isImportingPortfolio: false,
  activeTab: DEFAULT_PERSISTED_STATE.ui.activeTab,
  saveError: null,
  portfolioImportError: null,
  portfolioImportSuccess: false,
  profileUrlError: null,
  profilePreview: null,
  profile: DEFAULT_PERSISTED_STATE.profile,
  settings: DEFAULT_PERSISTED_STATE.settings,
  vacancy: null,
  activeTabUrl: null,
  isHhVacancyTab: false,
  manualVacancyUrl: "",
  isFetchingVacancy: false,
  vacancyError: null,
  generationInputError: null,
  generationResult: null,
  isGenerating: false,
  generationError: null,
  generationStage: "idle",
  letterDraft: null,
  copyFeedback: null,
  generationStartedAt: null,
  generationDurationMs: null,

  hydrate: (data) => {
    set({
      isHydrated: true,
      activeTab: data.ui.activeTab,
      profile: data.profile,
      settings: data.settings,
      saveError: null,
      portfolioImportError: null,
      portfolioImportSuccess: false,
      profileUrlError: null,
      profilePreview: buildProfilePreview(data.profile),
      generationInputError: resolveGenerationInputError(data.profile, null, data.settings),
    });
  },

  setActiveTab: async (tab) => {
    set({ activeTab: tab });
    try {
      await saveActiveTab(tab);
      set({ saveError: null });
    } catch (error) {
      set({ saveError: toAppError(error).message });
    }
  },

  updateProfile: (patch) => {
    set((state) => {
      const profile = { ...state.profile, ...patch };
      const profileUrlError =
        patch.portfolioLink !== undefined
          ? validatePortfolioUrl(patch.portfolioLink)
          : state.profileUrlError;

      return {
        profile,
        profileUrlError,
        portfolioImportSuccess: false,
        generationInputError: resolveGenerationInputError(profile, state.vacancy, state.settings),
      };
    });
  },

  updateSettings: (patch) => {
    const nextSettings = { ...get().settings, ...patch };
    set({
      settings: nextSettings,
      generationInputError: resolveGenerationInputError(get().profile, get().vacancy, nextSettings),
    });

    void (async () => {
      try {
        set({ isSaving: true });
        await persistSettings(nextSettings);
        set({ saveError: null });
      } catch (error) {
        set({ saveError: toAppError(error).message });
      } finally {
        set({ isSaving: false });
      }
    })();
  },

  importPortfolio: async () => {
    const url = get().profile.portfolioLink.trim();
    const profileUrlError = validatePortfolioUrl(url);

    if (!url) {
      set({ profileUrlError: "Укажите ссылку на портфолио" });
      return;
    }

    if (profileUrlError) {
      set({ profileUrlError });
      return;
    }

    try {
      await ensureOriginPermission(url);
    } catch (error) {
      set({
        portfolioImportError: getErrorMessage(error),
        portfolioImportSuccess: false,
      });
      return;
    }

    set({
      isImportingPortfolio: true,
      portfolioImportError: null,
      portfolioImportSuccess: false,
      profileUrlError: null,
    });

    try {
      const text = await importPortfolioFromUrl(url);
      set((state) => ({
        profile: { ...state.profile, portfolioText: text },
        portfolioImportError: null,
        portfolioImportSuccess: true,
        generationInputError: resolveGenerationInputError(
          { ...state.profile, portfolioText: text },
          state.vacancy,
          state.settings,
        ),
      }));
    } catch (error) {
      set({
        portfolioImportError: getErrorMessage(error),
        portfolioImportSuccess: false,
      });
    } finally {
      set({ isImportingPortfolio: false });
    }
  },

  clearProfilePreview: () => {
    set({ profilePreview: null });
  },

  setManualVacancyUrl: (url) => {
    set({ manualVacancyUrl: url, vacancyError: null });
  },

  refreshActiveTabInfo: async () => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const url = tab?.url ?? null;

      set({
        activeTabUrl: url,
        isHhVacancyTab: url ? isHhVacancyUrl(url) : false,
      });
    } catch {
      set({
        activeTabUrl: null,
        isHhVacancyTab: false,
      });
    }
  },

  scanActiveTab: async () => {
    let tab;

    try {
      [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    } catch {
      set({ vacancyError: "Не удалось определить активную вкладку" });
      return;
    }

    const activeTabUrl = tab?.url ?? null;

    if (!activeTabUrl) {
      set({ vacancyError: "Не удалось определить активную вкладку" });
      return;
    }

    const vacancyId = parseHhVacancyId(activeTabUrl);

    if (!vacancyId) {
      set({ vacancyError: "На активной вкладке нет вакансии HH" });
      return;
    }

    if (tab.id == null) {
      set({ vacancyError: "Не удалось определить активную вкладку" });
      return;
    }

    const sourceUrl = normalizeHhVacancyUrl(activeTabUrl) ?? undefined;

    set({
      activeTabUrl,
      isHhVacancyTab: true,
      isFetchingVacancy: true,
      vacancyError: null,
    });

    try {
      const vacancy = await fetchVacancyById(vacancyId, sourceUrl, tab.id);
      set({
        vacancy,
        manualVacancyUrl: sourceUrl ?? get().manualVacancyUrl,
        generationInputError: resolveGenerationInputError(get().profile, vacancy, get().settings),
      });
    } catch (error) {
      set({ vacancyError: getErrorMessage(error) });
    } finally {
      set({ isFetchingVacancy: false });
    }
  },

  importVacancyFromUrl: async (url) => {
    const input = (url ?? get().manualVacancyUrl).trim();
    const vacancyId = parseHhVacancyId(input);

    if (!vacancyId) {
      set({ vacancyError: "Вакансия не найдена или недоступна" });
      return;
    }

    const sourceUrl = normalizeHhVacancyUrl(input) ?? undefined;

    set({ isFetchingVacancy: true, vacancyError: null });

    try {
      const vacancy = await fetchVacancyById(vacancyId, sourceUrl);
      set({
        vacancy,
        manualVacancyUrl: sourceUrl ?? input,
        generationInputError: resolveGenerationInputError(get().profile, vacancy, get().settings),
      });
    } catch (error) {
      set({ vacancyError: getErrorMessage(error) });
    } finally {
      set({ isFetchingVacancy: false });
    }
  },

  clearVacancy: () => {
    set({
      vacancy: null,
      vacancyError: null,
      generationInputError: resolveGenerationInputError(get().profile, null, get().settings),
    });
  },

  checkGenerationReadiness: () => {
    const { profile, vacancy, settings } = get();
    set({ generationInputError: resolveGenerationInputError(profile, vacancy, settings) });
  },

  buildGenerationRequest: () => {
    const { profile, vacancy, settings } = get();
    const validation = validateGenerationInput(profile, vacancy, settings);

    if (!validation.ok) {
      set({ generationInputError: validation.error.message });
      return null;
    }

    if (!vacancy) {
      return null;
    }

    set({ generationInputError: null });
    return createGenerationRequest(profile, vacancy, settings);
  },

  generateLetter: async () => {
    const { profile, vacancy, settings, isGenerating } = get();

    if (isGenerating) {
      return;
    }

    const validation = validateGenerationInput(profile, vacancy, settings);

    if (!validation.ok) {
      set({
        generationError: validation.error.message,
        generationInputError: validation.error.message,
      });
      return;
    }

    if (!vacancy) {
      return;
    }

    const stageTimers: ReturnType<typeof setTimeout>[] = [];
    const startedAt = Date.now();

    set({
      isGenerating: true,
      generationError: null,
      generationStage: "analyzing",
      generationResult: null,
      letterDraft: null,
      generationStartedAt: startedAt,
      generationDurationMs: null,
    });

    stageTimers.push(
      setTimeout(() => {
        if (get().isGenerating) {
          set({ generationStage: "intersection" });
        }
      }, 2_000),
    );

    stageTimers.push(
      setTimeout(() => {
        if (get().isGenerating) {
          set({ generationStage: "writing" });
        }
      }, 4_000),
    );

    try {
      const result = await generateLetterFromContext(profile, vacancy, settings);
      set({ generationResult: result, generationError: null, letterDraft: null });
    } catch (error) {
      const message = getErrorMessage(error);

      if (message === GENERATION_CANCELLED_MESSAGE) {
        set({ generationError: null });
      } else {
        set({ generationError: message });
      }
    } finally {
      for (const timer of stageTimers) {
        clearTimeout(timer);
      }

      set({
        isGenerating: false,
        generationStage: "idle",
        generationDurationMs: Date.now() - startedAt,
      });
    }
  },

  regenerateLetter: async () => {
    await get().generateLetter();
  },

  cancelGeneration: () => {
    void cancelGenerationRequest();
  },

  openVacancyReply: () => {
    const { vacancy } = get();

    if (!vacancy) {
      return;
    }

    void browser.tabs.create({ url: getVacancyReplyUrl(vacancy) });
  },

  updateLetterDraft: (text) => {
    set({ letterDraft: text });
  },

  copyLetterToClipboard: async () => {
    const { generationResult, letterDraft } = get();

    if (!generationResult) {
      return;
    }

    const text = getDisplayLetter(letterDraft, generationResult.letter);

    try {
      await navigator.clipboard.writeText(text);

      if (copyFeedbackTimer) {
        clearTimeout(copyFeedbackTimer);
      }

      set({ copyFeedback: "success" });
      copyFeedbackTimer = setTimeout(() => {
        set({ copyFeedback: null });
        copyFeedbackTimer = null;
      }, 2_000);
    } catch {
      if (copyFeedbackTimer) {
        clearTimeout(copyFeedbackTimer);
      }

      set({ copyFeedback: "error" });
      copyFeedbackTimer = setTimeout(() => {
        set({ copyFeedback: null });
        copyFeedbackTimer = null;
      }, 2_000);
    }
  },

  clearGenerationResult: () => {
    set({
      generationResult: null,
      generationError: null,
      letterDraft: null,
      generationDurationMs: null,
    });
  },

  saveProfile: async () => {
    const { profile } = get();
    const profileUrlError = validatePortfolioUrl(profile.portfolioLink);

    if (profileUrlError) {
      set({ profileUrlError, saveError: null });
      return;
    }

    try {
      set({ isSaving: true, saveError: null, profileUrlError: null });
      await persistProfile(profile);
      set({
        profilePreview: buildProfilePreview(profile),
        generationInputError: resolveGenerationInputError(profile, get().vacancy, get().settings),
      });
    } catch (error) {
      set({ saveError: toAppError(error).message });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  clearProfile: async () => {
    const profile = DEFAULT_PERSISTED_STATE.profile;

    try {
      set({ isSaving: true, saveError: null });
      await persistProfile(profile);
      set({
        profile,
        profilePreview: null,
        profileUrlError: null,
        portfolioImportError: null,
        portfolioImportSuccess: false,
        generationInputError: resolveGenerationInputError(profile, get().vacancy, get().settings),
      });
    } catch (error) {
      set({ saveError: toAppError(error).message });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  saveSettings: async () => {
    const { settings } = get();
    try {
      set({ isSaving: true, saveError: null });
      await persistSettings(settings);
    } catch (error) {
      set({ saveError: toAppError(error).message });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  loadFromStorage: async () => {
    try {
      const data = await loadPersistedState();
      get().hydrate(data);
    } catch (error) {
      get().hydrate(DEFAULT_PERSISTED_STATE);
      set({ saveError: toAppError(error).message });
    }
  },
}));
