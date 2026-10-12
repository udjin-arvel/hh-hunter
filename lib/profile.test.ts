import { describe, expect, it } from "vitest";

import { getProfilePreviewText, truncatePreview, validatePortfolioUrl } from "./profile";
import type { Profile } from "./types";

const baseProfile: Profile = {
  name: "Test",
  portfolioLink: "",
  portfolioText: "",
};

describe("validatePortfolioUrl", () => {
  it("allows empty value", () => {
    expect(validatePortfolioUrl("")).toBeNull();
    expect(validatePortfolioUrl("   ")).toBeNull();
  });

  it("accepts http and https urls", () => {
    expect(validatePortfolioUrl("https://github.com/user")).toBeNull();
    expect(validatePortfolioUrl("http://example.com")).toBeNull();
  });

  it("rejects invalid urls", () => {
    expect(validatePortfolioUrl("not-a-url")).not.toBeNull();
    expect(validatePortfolioUrl("ftp://example.com")).not.toBeNull();
  });
});

describe("getProfilePreviewText", () => {
  it("returns portfolio text", () => {
    const profile: Profile = {
      ...baseProfile,
      portfolioText: "Imported resume text",
    };

    expect(getProfilePreviewText(profile)).toBe("Imported resume text");
  });

  it("returns empty string when portfolio is empty", () => {
    expect(getProfilePreviewText(baseProfile)).toBe("");
  });
});

describe("truncatePreview", () => {
  it("truncates long text with ellipsis", () => {
    const text = "a".repeat(250);
    expect(truncatePreview(text, 200)).toBe(`${"a".repeat(200)}…`);
  });

  it("keeps short text unchanged", () => {
    expect(truncatePreview("short")).toBe("short");
  });
});
