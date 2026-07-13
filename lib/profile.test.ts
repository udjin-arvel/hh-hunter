import { describe, expect, it } from "vitest";

import { getProfilePreviewText, truncatePreview, validatePortfolioUrl } from "./profile";
import type { Profile } from "./types";

const baseProfile: Profile = {
  name: "Test",
  portfolioLink: "",
  portfolioText: "",
  achievements: "",
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
  it("prefers portfolioText over achievements", () => {
    const profile: Profile = {
      ...baseProfile,
      portfolioText: "Imported text",
      achievements: "Manual text",
    };

    expect(getProfilePreviewText(profile)).toBe("Imported text");
  });

  it("falls back to achievements", () => {
    const profile: Profile = {
      ...baseProfile,
      achievements: "Manual text",
    };

    expect(getProfilePreviewText(profile)).toBe("Manual text");
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
