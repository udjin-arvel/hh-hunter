import { describe, expect, it } from "vitest";

import { getProfilePreviewText, truncatePreview } from "@/lib/profile";
import type { Profile } from "@/lib/types";

const baseProfile: Profile = {
  name: "Test",
  portfolioLink: "",
  portfolioText: "",
  technologiesToStudy: [],
};

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
