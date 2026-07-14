import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { migrateRawStorage } from "./migrations";
import { STORAGE_KEY, loadPersistedState, savePersistedState } from "./storage";
import { DEFAULT_PERSISTED_STATE } from "./types";

describe("migrateRawStorage", () => {
  it("returns defaults for null", () => {
    expect(migrateRawStorage(null)).toEqual(DEFAULT_PERSISTED_STATE);
  });

  it("migrates legacy payload without version", () => {
    const migrated = migrateRawStorage({
      profile: { name: "Test" },
      settings: { style: "emotional" },
    });

    expect(migrated.version).toBe(2);
    expect(migrated.profile.name).toBe("Test");
    expect(migrated.settings.style).toBe("conversational");
    expect(migrated.settings.format).toBe("letter");
  });

  it("falls back for unknown version", () => {
    expect(migrateRawStorage({ version: 99 })).toEqual(DEFAULT_PERSISTED_STATE);
  });
});

describe("storage repository", () => {
  let storageMap: Record<string, unknown>;

  beforeEach(() => {
    storageMap = {};

    vi.stubGlobal("browser", {
      storage: {
        local: {
          get: vi.fn(async (key: string | string[] | Record<string, unknown>) => {
            if (typeof key === "string") {
              return { [key]: storageMap[key] };
            }

            if (Array.isArray(key)) {
              return key.reduce<Record<string, unknown>>((acc, item) => {
                acc[item] = storageMap[item];
                return acc;
              }, {});
            }

            return Object.keys(key).reduce<Record<string, unknown>>((acc, item) => {
              acc[item] = storageMap[item];
              return acc;
            }, {});
          }),
          set: vi.fn(async (items: Record<string, unknown>) => {
            Object.assign(storageMap, items);
          }),
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("roundtrips persisted state", async () => {
    const payload = {
      ...DEFAULT_PERSISTED_STATE,
      profile: { ...DEFAULT_PERSISTED_STATE.profile, name: "Анна" },
      ui: { activeTab: "profile" as const },
    };

    await savePersistedState(payload);
    const loaded = await loadPersistedState();

    expect(loaded.profile.name).toBe("Анна");
    expect(loaded.ui.activeTab).toBe("profile");
    expect(storageMap[STORAGE_KEY]).toBeDefined();
  });
});
