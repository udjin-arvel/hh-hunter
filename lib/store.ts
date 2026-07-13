import { create } from "zustand";

import { toAppError } from "./errors";
import { getErrorMessage, importPortfolioFromUrl } from "./messaging";
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
  type GenerationSettings,
  type Profile,
  type TabKey,
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
  hydrate: (data: PersistedState) => void;
  setActiveTab: (tab: TabKey) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => void;
  updateSettings: (patch: Partial<GenerationSettings>) => void;
  setApiKey: (key: string) => void;
  importPortfolio: () => Promise<void>;
  clearProfilePreview: () => void;
  saveProfile: () => Promise<void>;
  saveSettings: () => Promise<void>;
  saveApiKey: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

function buildProfilePreview(profile: Profile): string | null {
  const previewSource = getProfilePreviewText(profile);
  return previewSource ? truncatePreview(previewSource) : null;
}

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
      };
    });
  },

  updateSettings: (patch) => {
    const nextSettings = { ...get().settings, ...patch };
    set({ settings: nextSettings });

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
    set({ apiKey: key });
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
      set({ profilePreview: buildProfilePreview(profile) });
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
