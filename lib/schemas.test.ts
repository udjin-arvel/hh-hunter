import { describe, expect, it } from "vitest";

import { createAppError, isAppError } from "./errors";
import { generationSettingsSchema, profileSchema } from "./schemas";

describe("profileSchema", () => {
  it("accepts empty profile with defaults", () => {
    const result = profileSchema.parse({});

    expect(result).toEqual({
      name: "",
      portfolioLink: "",
      portfolioText: "",
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
