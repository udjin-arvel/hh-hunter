import { createAppError } from "./errors";
import { migrateRawStorage } from "./migrations";
import { persistedStateSchema } from "./schemas";
import type { GenerationSettings, PersistedState, Profile, TabKey } from "./types";

export const STORAGE_KEY = "hh-hunter:v1";

async function readRawStorage(): Promise<unknown> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY];
  } catch (error) {
    throw createAppError("UNKNOWN", "Не удалось прочитать локальное хранилище", error);
  }
}

async function writeRawStorage(state: PersistedState): Promise<void> {
  try {
    await browser.storage.local.set({ [STORAGE_KEY]: state });
  } catch (error) {
    throw createAppError("UNKNOWN", "Не удалось сохранить локальное хранилище", error);
  }
}

export async function loadPersistedState(): Promise<PersistedState> {
  const raw = await readRawStorage();
  return migrateRawStorage(raw);
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  const parsed = persistedStateSchema.parse(state);
  await writeRawStorage(parsed);
}

async function updatePersistedState(
  updater: (current: PersistedState) => PersistedState,
): Promise<PersistedState> {
  const current = await loadPersistedState();
  const next = updater(current);
  await savePersistedState(next);
  return next;
}

export async function saveProfile(profile: Profile): Promise<void> {
  await updatePersistedState((current) => ({
    ...current,
    profile,
  }));
}

export async function saveSettings(settings: GenerationSettings): Promise<void> {
  await updatePersistedState((current) => ({
    ...current,
    settings,
  }));
}

export async function saveActiveTab(activeTab: TabKey): Promise<void> {
  await updatePersistedState((current) => ({
    ...current,
    ui: { activeTab },
  }));
}
