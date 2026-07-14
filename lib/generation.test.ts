import { describe, expect, it } from "vitest";

import {
  countThesesLines,
  countWords,
  getDisplayLetter,
  parseGenerationResult,
  validateGenerationInput,
  validateGenerationResult,
} from "./generation";
import type { GenerationSettings, Profile, Vacancy } from "./types";

const profile: Profile = {
  name: "Александр",
  portfolioLink: "",
  portfolioText: "",
  achievements: "а".repeat(100),
};

const vacancy: Vacancy = {
  id: "1",
  title: "Дизайнер",
  company_name: "Компания",
  company_type: "",
  description: "Описание вакансии",
  key_skills: ["Figma"],
  experience_required: "1–3 года",
  employment: "Удалённо",
};

const settings: GenerationSettings = {
  format: "letter",
  style: "business",
  length: "medium",
  focus: "",
};

function buildLetter(wordCount: number): string {
  return Array.from({ length: wordCount }, (_, index) => `слово${index + 1}`).join(" ");
}

function buildTheses(lineCount: number): string {
  return Array.from(
    { length: lineCount },
    (_, index) => `Делал полезную вещь номер ${index + 1}.`,
  ).join("\n");
}

function buildValidResult(wordCount: number) {
  return {
    hidden_keys: ["ключ1", "ключ2", "ключ3"],
    unique_intersection: "Точка пересечения между опытом и вакансией достаточно длинная.",
    letter: buildLetter(wordCount),
  };
}

function buildValidThesesResult(lineCount: number) {
  return {
    hidden_keys: ["ключ1", "ключ2", "ключ3"],
    unique_intersection: "Точка пересечения между опытом и вакансией достаточно длинная.",
    letter: buildTheses(lineCount),
  };
}

describe("validateGenerationInput", () => {
  it("rejects missing vacancy", () => {
    const result = validateGenerationInput(profile, null, settings);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Загрузите вакансию");
    }
  });

  it("rejects short profile text", () => {
    const shortProfile: Profile = {
      ...profile,
      achievements: "короткий текст",
    };

    const result = validateGenerationInput(shortProfile, vacancy, settings);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("100 символов");
    }
  });

  it("accepts valid profile and vacancy", () => {
    const result = validateGenerationInput(profile, vacancy, settings);

    expect(result).toEqual({ ok: true });
  });
});

describe("getDisplayLetter", () => {
  it("returns draft when present", () => {
    expect(getDisplayLetter("edited text", "original")).toBe("edited text");
  });

  it("falls back to generated letter when draft is null", () => {
    expect(getDisplayLetter(null, "generated letter")).toBe("generated letter");
  });
});

describe("countWords", () => {
  it("counts words in russian text", () => {
    expect(countWords("один два три")).toBe(3);
    expect(countWords("  один   два  ")).toBe(2);
    expect(countWords("")).toBe(0);
  });
});

describe("countThesesLines", () => {
  it("counts nonempty lines", () => {
    expect(countThesesLines("один\nдва\n\nтри")).toBe(3);
    expect(countThesesLines("")).toBe(0);
  });
});

describe("validateGenerationResult", () => {
  it("accepts result within word range", () => {
    const result = validateGenerationResult(buildValidResult(100), "medium", "letter");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.hidden_keys).toHaveLength(3);
    }
  });

  it("accepts theses within line range", () => {
    const result = validateGenerationResult(buildValidThesesResult(7), "medium", "theses");

    expect(result.ok).toBe(true);
  });

  it("accepts theses outside suggested line range", () => {
    const result = validateGenerationResult(buildValidThesesResult(2), "medium", "theses");

    expect(result.ok).toBe(true);
  });

  it("accepts more theses than short length suggests", () => {
    const result = validateGenerationResult(buildValidThesesResult(8), "short", "theses");

    expect(result.ok).toBe(true);
  });

  it("rejects too few hidden keys", () => {
    const result = validateGenerationResult(
      {
        hidden_keys: ["один"],
        unique_intersection: "Достаточно длинная точка пересечения для валидации.",
        letter: buildLetter(100),
      },
      "medium",
      "letter",
    );

    expect(result.ok).toBe(false);
  });

  it("rejects letter outside word range", () => {
    const result = validateGenerationResult(buildValidResult(20), "medium", "letter");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Длина письма");
    }
  });
});

describe("parseGenerationResult", () => {
  it("parses clean JSON", () => {
    const raw = JSON.stringify(buildValidResult(100));
    const result = parseGenerationResult(raw, "medium", "letter");

    expect(result.ok).toBe(true);
  });

  it("parses theses JSON", () => {
    const raw = JSON.stringify(buildValidThesesResult(7));
    const result = parseGenerationResult(raw, "medium", "theses");

    expect(result.ok).toBe(true);
  });

  it("parses JSON inside markdown fence", () => {
    const raw = `\`\`\`json\n${JSON.stringify(buildValidResult(100))}\n\`\`\``;
    const result = parseGenerationResult(raw, "medium", "letter");

    expect(result.ok).toBe(true);
  });

  it("parses JSON with surrounding text", () => {
    const raw = `Вот результат:\n${JSON.stringify(buildValidResult(100))}\nГотово.`;
    const result = parseGenerationResult(raw, "medium", "letter");

    expect(result.ok).toBe(true);
  });

  it("rejects invalid JSON", () => {
    const result = parseGenerationResult("not json at all", "medium", "letter");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("не соответствует формату");
    }
  });
});
