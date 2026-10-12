import { persistedStateSchema, STORAGE_VERSION, tabKeySchema } from "./schemas";
import { DEFAULT_PERSISTED_STATE, type PersistedState } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeActiveTab(value: unknown): "profile" | "generator" | "examples" {
  const parsed = tabKeySchema.safeParse(value);
  return parsed.success ? parsed.data : "generator";
}

function normalizeFantasy(value: unknown): "low" | "medium" | "high" {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "medium";
}

function normalizeProfileFromLegacy(profile: Record<string, unknown>): {
  name: string;
  portfolioLink: string;
  portfolioText: string;
} {
  const portfolioTextRaw =
    typeof profile.portfolioText === "string" ? profile.portfolioText.trim() : "";
  const achievementsRaw =
    typeof profile.achievements === "string" ? profile.achievements.trim() : "";

  const portfolioText = portfolioTextRaw || achievementsRaw;

  return {
    name: typeof profile.name === "string" ? profile.name : "",
    portfolioLink: typeof profile.portfolioLink === "string" ? profile.portfolioLink : "",
    portfolioText,
  };
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeSettingsFromLegacy(settings: Record<string, unknown>): {
  length: "short" | "medium" | "long";
  focus: string;
  fantasy: "low" | "medium" | "high";
  exampleIds: string[];
  includeTheses: boolean;
  includeHiddenKeys: boolean;
} {
  const length =
    settings.length === "short" || settings.length === "long" ? settings.length : "medium";

  return {
    length,
    focus: typeof settings.focus === "string" ? settings.focus : "",
    fantasy: normalizeFantasy(settings.fantasy),
    exampleIds: Array.isArray(settings.exampleIds)
      ? settings.exampleIds.filter((id): id is string => typeof id === "string")
      : [],
    includeTheses: normalizeBoolean(settings.includeTheses, true),
    includeHiddenKeys: normalizeBoolean(settings.includeHiddenKeys, true),
  };
}

function normalizeExamples(value: unknown): PersistedState["examples"] {
  if (!Array.isArray(value)) {
    return [];
  }

  const examples: PersistedState["examples"] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const id = typeof item.id === "string" ? item.id : "";
    const title = typeof item.title === "string" ? item.title : "";
    const letter = typeof item.letter === "string" ? item.letter : "";

    if (!id || !title || !letter) {
      continue;
    }

    examples.push({
      id,
      title,
      letter,
      favorite: Boolean(item.favorite),
    });
  }

  return examples;
}

function buildV3State(raw: {
  profile: Record<string, unknown>;
  settings: Record<string, unknown>;
  ui: Record<string, unknown>;
  examples?: unknown;
}): PersistedState {
  return persistedStateSchema.parse({
    version: STORAGE_VERSION,
    profile: normalizeProfileFromLegacy(raw.profile),
    settings: normalizeSettingsFromLegacy(raw.settings),
    examples: normalizeExamples(raw.examples),
    ui: {
      activeTab: normalizeActiveTab(raw.ui.activeTab),
    },
  });
}

function migrateV1ToV3(raw: Record<string, unknown>): PersistedState {
  const profile = isRecord(raw.profile) ? raw.profile : {};
  const settings = isRecord(raw.settings) ? raw.settings : {};
  const ui = isRecord(raw.ui) ? raw.ui : {};

  const migrated = buildV3State({ profile, settings, ui });

  return migrated;
}

function migrateLegacyV0(raw: Record<string, unknown>): PersistedState {
  const profile = isRecord(raw.profile) ? raw.profile : {};
  const settings = isRecord(raw.settings) ? raw.settings : {};
  const ui = isRecord(raw.ui) ? raw.ui : {};

  return buildV3State({ profile, settings, ui });
}

function migrateV2ToV3(raw: Record<string, unknown>): PersistedState {
  const profile = isRecord(raw.profile) ? raw.profile : {};
  const settings = isRecord(raw.settings) ? raw.settings : {};
  const ui = isRecord(raw.ui) ? raw.ui : {};

  return buildV3State({ profile, settings, ui, examples: raw.examples });
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
    const profile = isRecord(raw.profile) ? raw.profile : {};
    const settings = isRecord(raw.settings) ? raw.settings : {};
    const ui = isRecord(raw.ui) ? raw.ui : {};

    const normalized = {
      version: STORAGE_VERSION,
      profile: normalizeProfileFromLegacy(profile),
      settings: normalizeSettingsFromLegacy(settings),
      examples: normalizeExamples(raw.examples),
      ui: {
        activeTab: normalizeActiveTab(ui.activeTab),
      },
    };

    const parsed = persistedStateSchema.safeParse(normalized);
    if (parsed.success) {
      return parsed.data;
    }

    console.warn("[hh-hunter] Failed to parse v3 storage, using defaults");
    return DEFAULT_PERSISTED_STATE;
  }

  if (raw.version === 2) {
    return migrateV2ToV3(raw);
  }

  if (raw.version === 1) {
    return migrateV1ToV3(raw);
  }

  if (raw.version == null) {
    return migrateLegacyV0(raw);
  }

  console.warn("[hh-hunter] Unknown storage version, using defaults", raw.version);
  return DEFAULT_PERSISTED_STATE;
}
