import { describe, expect, it } from "vitest";

import { migrateRawStorage } from "./migrations";
import { DEFAULT_PERSISTED_STATE } from "./types";

describe("migrateRawStorage edge cases", () => {
  it("returns defaults for non-object payload", () => {
    expect(migrateRawStorage("invalid")).toEqual(DEFAULT_PERSISTED_STATE);
    expect(migrateRawStorage(42)).toEqual(DEFAULT_PERSISTED_STATE);
  });

  it("falls back when v1 payload is corrupt", () => {
    const result = migrateRawStorage({
      version: 1,
      profile: { name: 123 },
      settings: { style: "not-a-style" },
    });

    expect(result).toEqual(DEFAULT_PERSISTED_STATE);
  });

  it("falls back when v1 profile fields have invalid types", () => {
    const result = migrateRawStorage({
      version: 1,
      profile: {
        name: "Test",
        portfolioLink: null,
        achievements: ["not", "a", "string"],
      },
      settings: {
        style: "business",
        length: "medium",
        focus: "",
      },
      apiKey: "",
      ui: { activeTab: "generator" },
    });

    expect(result).toEqual(DEFAULT_PERSISTED_STATE);
  });

  it("migrates legacy v0 with partial profile and settings", () => {
    const result = migrateRawStorage({
      profile: { name: "Legacy User" },
    });

    expect(result.version).toBe(1);
    expect(result.profile.name).toBe("Legacy User");
    expect(result.profile.achievements).toBe("");
    expect(result.settings.style).toBe("business");
    expect(result.settings.length).toBe("medium");
    expect(result.ui.activeTab).toBe("generator");
  });

  it("migrates legacy v0 when profile and settings are not objects", () => {
    const result = migrateRawStorage({
      profile: null,
      settings: "invalid",
      ui: 0,
      apiKey: 123,
    });

    expect(result.version).toBe(1);
    expect(result.profile.name).toBe("");
    expect(result.apiKey).toBe("");
    expect(result.ui.activeTab).toBe("generator");
  });

  it("preserves apiKey string in legacy v0", () => {
    const result = migrateRawStorage({
      apiKey: "sk-test-key",
    });

    expect(result.apiKey).toBe("sk-test-key");
  });
});
