import { describe, expect, it } from "vitest";

import {
  cleanTechnologiesFromModel,
  mergeTechnologiesToStudy,
  TECHNOLOGY_NAME_MAX_CHARS,
} from "@/lib/technologies";

describe("cleanTechnologiesFromModel", () => {
  it("trims, deduplicates case-insensitively and caps count", () => {
    const result = cleanTechnologiesFromModel([
      " Redis ",
      "redis",
      "Go",
      "GO",
      "DDD",
    ]);

    expect(result).toEqual(["Redis", "Go", "DDD"]);
  });

  it("drops empty and overly long names", () => {
    const long = "x".repeat(TECHNOLOGY_NAME_MAX_CHARS + 1);
    const result = cleanTechnologiesFromModel(["", "  ", "OK", long]);

    expect(result).toEqual(["OK"]);
  });

  it("returns empty array for non-array input", () => {
    expect(cleanTechnologiesFromModel(null)).toEqual([]);
    expect(cleanTechnologiesFromModel("Redis")).toEqual([]);
  });
});

describe("mergeTechnologiesToStudy", () => {
  it("merges without duplicating case variants", () => {
    const merged = mergeTechnologiesToStudy(["Redis", "Go"], ["redis", "DDD", "go"]);

    expect(merged).toEqual(["Redis", "Go", "DDD"]);
  });

  it("keeps existing canonical spelling when duplicate arrives", () => {
    const merged = mergeTechnologiesToStudy(["PostgreSQL"], ["postgresql"]);

    expect(merged).toEqual(["PostgreSQL"]);
  });
});
