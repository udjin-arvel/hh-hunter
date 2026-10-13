import { describe, expect, it } from "vitest";

import { createAppError, isAppError } from "@/lib/errors";
import { generationSettingsSchema, profileSchema } from "@/lib/schemas";

describe("profileSchema", () => {
  it("accepts empty profile with defaults", () => {
    const result = profileSchema.parse({});

    expect(result).toEqual({
      name: "",
      portfolioLink: "",
      portfolioText: "",
      technologiesToStudy: [],
      hiddenTechnologiesToStudy: [],
    });
  });
});

describe("generationSettingsSchema", () => {
  it("applies defaults from the spec", () => {
    const result = generationSettingsSchema.parse({});

    expect(result).toEqual({
      length: "medium",
      focus: "",
      fantasy: "medium",
      exampleIds: [],
      includeTheses: true,
      includeHiddenKeys: true,
      includeTechnologies: true,
    });
  });
});

describe("createAppError", () => {
  it("creates a typed app error", () => {
    const error = createAppError("VALIDATION", "Invalid input");

    expect(isAppError(error)).toBe(true);
    expect(error.code).toBe("VALIDATION");
    expect(error.message).toBe("Invalid input");
  });
});
