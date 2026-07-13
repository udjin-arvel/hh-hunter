import { persistedStateSchema, STORAGE_VERSION, tabKeySchema } from "./schemas";
import { DEFAULT_PERSISTED_STATE, type PersistedState } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeActiveTab(value: unknown): "profile" | "generator" {
  const parsed = tabKeySchema.safeParse(value);
  return parsed.success ? parsed.data : "generator";
}

function migrateV1ToV2(raw: Record<string, unknown>): PersistedState {
  const profile = isRecord(raw.profile) ? raw.profile : {};
  const settings = isRecord(raw.settings) ? raw.settings : {};
  const ui = isRecord(raw.ui) ? raw.ui : {};

  const migrated = persistedStateSchema.safeParse({
    version: STORAGE_VERSION,
    profile: {
      name: profile.name ?? "",
      portfolioLink: profile.portfolioLink ?? "",
      portfolioText: profile.portfolioText ?? "",
      achievements: profile.achievements ?? "",
    },
    settings: {
      style: settings.style ?? "business",
      length: settings.length ?? "medium",
      focus: settings.focus ?? "",
    },
    ui: {
      activeTab: normalizeActiveTab(ui.activeTab),
    },
  });

  if (migrated.success) {
    return migrated.data;
  }

  console.warn("[hh-hunter] Failed to migrate v1 storage, using defaults");
  return DEFAULT_PERSISTED_STATE;
}

function migrateLegacyV0(raw: Record<string, unknown>): PersistedState {
  const profile = isRecord(raw.profile) ? raw.profile : {};
  const settings = isRecord(raw.settings) ? raw.settings : {};
  const ui = isRecord(raw.ui) ? raw.ui : {};

  return persistedStateSchema.parse({
    version: STORAGE_VERSION,
    profile: {
      name: profile.name ?? "",
      portfolioLink: profile.portfolioLink ?? "",
      portfolioText: profile.portfolioText ?? "",
      achievements: profile.achievements ?? "",
    },
    settings: {
      style: settings.style ?? "business",
      length: settings.length ?? "medium",
      focus: settings.focus ?? "",
    },
    ui: {
      activeTab: normalizeActiveTab(ui.activeTab),
    },
  });
}

export function migrateRawStorage(raw: unknown): PersistedState {
  if (raw == null) {
    return DEFAULT_PERSISTED_STATE;
  }

  if (!isRecord(raw)) {
    console.warn("[hh-hunter] Invalid storage payload, using defaults");
    return DEFAULT_PERSISTED_STATE;
  }

  if (raw.version === STORAGE_VERSION) {
    const parsed = persistedStateSchema.safeParse(raw);
    if (parsed.success) {
      return parsed.data;
    }

    console.warn("[hh-hunter] Failed to parse v2 storage, using defaults");
    return DEFAULT_PERSISTED_STATE;
  }

  if (raw.version === 1) {
    return migrateV1ToV2(raw);
  }

  if (raw.version == null) {
    return migrateLegacyV0(raw);
  }

  console.warn("[hh-hunter] Unknown storage version, using defaults", raw.version);
  return DEFAULT_PERSISTED_STATE;
}
