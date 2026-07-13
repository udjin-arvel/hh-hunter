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
  verifyApiKey as verifyApiKeyRequest,
} from "./messaging";
import { buildGenerationRequest as createGenerationRequest } from "./prompts";
import { getProfilePreviewText, truncatePreview, validatePortfolioUrl } from "./profile";
import {
  loadPersistedState,
  saveActiveTab,
  saveApiKey as persistApiKey,
  saveProfile as persistProfile,
  saveSettings as persistSettings,
} from "./storage";
import {
  DEFAULT_PERSISTED_STATE,
  type ApiKeyStatus,
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
  apiKey: string;
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
  apiKeyStatus: ApiKeyStatus;
  apiKeyVerifyError: string | null;
  isVerifyingApiKey: boolean;
  letterDraft: string | null;
  copyFeedback: "success" | "error" | null;
  generationStartedAt: number | null;
  generationDurationMs: number | null;
  hydrate: (data: PersistedState) => void;
  setActiveTab: (tab: TabKey) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => void;
  updateSettings: (patch: Partial<GenerationSettings>) => void;
  setApiKey: (key: string) => void;
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
  verifyApiKey: () => Promise<void>;
  clearGenerationResult: () => void;
  saveProfile: () => Promise<void>;
  saveSettings: () => Promise<void>;
  saveApiKey: () => Promise<void>;
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
  apiKey: string,
): string | null {
  const result = validateGenerationInput(profile, vacancy, settings, apiKey);
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
  apiKey: DEFAULT_PERSISTED_STATE.apiKey,
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
  apiKeyStatus: "unchecked",
  apiKeyVerifyError: null,
  isVerifyingApiKey: false,
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
      apiKey: data.apiKey,
      saveError: null,
      portfolioImportError: null,
      portfolioImportSuccess: false,
      profileUrlError: null,
      profilePreview: buildProfilePreview(data.profile),
      generationInputError: resolveGenerationInputError(
        data.profile,
        null,
        data.settings,
        data.apiKey,
      ),
      apiKeyStatus: "unchecked",
      apiKeyVerifyError: null,
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
        generationInputError: resolveGenerationInputError(
          profile,
          state.vacancy,
          state.settings,
          state.apiKey,
        ),
      };
    });
  },

  updateSettings: (patch) => {
    const nextSettings = { ...get().settings, ...patch };
    set({
      settings: nextSettings,
      generationInputError: resolveGenerationInputError(
        get().profile,
        get().vacancy,
        nextSettings,
        get().apiKey,
      ),
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

  setApiKey: (key) => {
    set((state) => ({
      apiKey: key,
      apiKeyStatus: "unchecked",
      apiKeyVerifyError: null,
      generationInputError: resolveGenerationInputError(
        state.profile,
        state.vacancy,
        state.settings,
        key,
      ),
    }));
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
          state.apiKey,
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
    const { activeTabUrl } = get();

    if (!activeTabUrl) {
      set({ vacancyError: "Не удалось определить активную вкладку" });
      return;
    }

    const vacancyId = parseHhVacancyId(activeTabUrl);

    if (!vacancyId) {
      set({ vacancyError: "На активной вкладке нет вакансии HH" });
      return;
    }

    const sourceUrl = normalizeHhVacancyUrl(activeTabUrl) ?? undefined;

    set({ isFetchingVacancy: true, vacancyError: null });

    try {
      const vacancy = await fetchVacancyById(vacancyId, sourceUrl);
      set({
        vacancy,
        manualVacancyUrl: sourceUrl ?? get().manualVacancyUrl,
        generationInputError: resolveGenerationInputError(
          get().profile,
          vacancy,
          get().settings,
          get().apiKey,
        ),
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
        generationInputError: resolveGenerationInputError(
          get().profile,
          vacancy,
          get().settings,
          get().apiKey,
        ),
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
      generationInputError: resolveGenerationInputError(
        get().profile,
        null,
        get().settings,
        get().apiKey,
      ),
    });
  },

  checkGenerationReadiness: () => {
    const { profile, vacancy, settings, apiKey } = get();
    set({ generationInputError: resolveGenerationInputError(profile, vacancy, settings, apiKey) });
  },

  buildGenerationRequest: () => {
    const { profile, vacancy, settings, apiKey } = get();
    const validation = validateGenerationInput(profile, vacancy, settings, apiKey);

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
    const { profile, vacancy, settings, apiKey, isGenerating } = get();

    if (isGenerating) {
      return;
    }

    const validation = validateGenerationInput(profile, vacancy, settings, apiKey);

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
      const result = await generateLetterFromContext(apiKey, profile, vacancy, settings);
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

  verifyApiKey: async () => {
    const { apiKey } = get();

    if (!apiKey.trim()) {
      set({
        apiKeyStatus: "invalid",
        apiKeyVerifyError: "Укажите API-ключ перед проверкой.",
      });
      return;
    }

    set({ isVerifyingApiKey: true, apiKeyVerifyError: null });

    try {
      await verifyApiKeyRequest(apiKey);
      set({ apiKeyStatus: "valid", apiKeyVerifyError: null });
    } catch (error) {
      set({ apiKeyStatus: "invalid", apiKeyVerifyError: getErrorMessage(error) });
    } finally {
      set({ isVerifyingApiKey: false });
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
        generationInputError: resolveGenerationInputError(
          profile,
          get().vacancy,
          get().settings,
          get().apiKey,
        ),
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

  saveApiKey: async () => {
    const { apiKey } = get();
    try {
      set({ isSaving: true, saveError: null });
      await persistApiKey(apiKey);
      set({ apiKeyStatus: "unchecked", apiKeyVerifyError: null });
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
