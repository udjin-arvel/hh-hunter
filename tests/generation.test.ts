import { describe, expect, it } from "vitest";

import {
  countThesesLines,
  countWords,
  formatThesesForDisplay,
  getDisplayLetter,
  parseGenerationResult,
  validateGenerationInput,
  validateGenerationResult,
} from "@/lib/generation";
import type { GenerationSettings, Profile, Vacancy } from "@/lib/types";

const profile: Profile = {
  name: "Александр",
  portfolioLink: "",
  portfolioText: "а".repeat(100),
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
  length: "medium",
  focus: "",
  fantasy: "medium",
  exampleIds: [],
  includeTheses: true,
  includeHiddenKeys: true,
};

function buildLetter(wordCount: number): string {
  return Array.from({ length: wordCount }, (_, index) => `слово${index + 1}`).join(" ");
}

function buildTheses(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `Делал полезную вещь номер ${index + 1}.`);
}

function buildValidResult(wordCount: number, thesesCount = 5) {
  return {
    hidden_keys: ["ключ1", "ключ2", "ключ3"],
    unique_intersection: "Точка пересечения между опытом и вакансией достаточно длинная.",
    letter: buildLetter(wordCount),
    theses: buildTheses(thesesCount),
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
      portfolioText: "короткий текст",
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

describe("formatThesesForDisplay", () => {
  it("joins theses with newlines", () => {
    expect(formatThesesForDisplay(["один", "два"])).toBe("один\nдва");
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
  it("accepts result within word range and theses count", () => {
    const result = validateGenerationResult(buildValidResult(100), "medium");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.hidden_keys).toHaveLength(3);
      expect(result.result.theses).toHaveLength(5);
    }
  });

  it("rejects too few theses", () => {
    const result = validateGenerationResult(buildValidResult(100, 2), "medium");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Количество тезисов");
    }
  });

  it("accepts a letter without optional blocks when they are disabled", () => {
    const result = validateGenerationResult(
      {
        unique_intersection: "Достаточно длинная точка пересечения для валидации.",
        letter: buildLetter(100),
        hidden_keys: ["лишний"],
        theses: ["Лишний тезис."],
      },
      "medium",
      { includeTheses: false, includeHiddenKeys: false },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.theses).toEqual([]);
      expect(result.result.hidden_keys).toEqual([]);
    }
  });

  it("still requires theses when that option is enabled", () => {
    const result = validateGenerationResult(
      {
        hidden_keys: ["ключ1", "ключ2", "ключ3"],
        unique_intersection: "Достаточно длинная точка пересечения для валидации.",
        letter: buildLetter(100),
      },
      "medium",
      { includeTheses: true, includeHiddenKeys: true },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Количество тезисов");
    }
  });

  it("rejects too few hidden keys", () => {
    const result = validateGenerationResult(
      {
        hidden_keys: ["один"],
        unique_intersection: "Достаточно длинная точка пересечения для валидации.",
        letter: buildLetter(100),
        theses: buildTheses(4),
      },
      "medium",
    );

    expect(result.ok).toBe(false);
  });

  it("rejects letter outside word range", () => {
    const result = validateGenerationResult(buildValidResult(20), "medium");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Длина письма");
    }
  });
});

describe("parseGenerationResult", () => {
  it("parses clean JSON", () => {
    const raw = JSON.stringify(buildValidResult(100));
    const result = parseGenerationResult(raw, "medium");

    expect(result.ok).toBe(true);
  });

  it("parses JSON inside markdown fence", () => {
    const raw = `\`\`\`json\n${JSON.stringify(buildValidResult(100))}\n\`\`\``;
    const result = parseGenerationResult(raw, "medium");

    expect(result.ok).toBe(true);
  });

  it("parses JSON with surrounding text", () => {
    const raw = `Вот результат:\n${JSON.stringify(buildValidResult(100))}\nГотово.`;
    const result = parseGenerationResult(raw, "medium");

    expect(result.ok).toBe(true);
  });

  it("rejects invalid JSON", () => {
    const result = parseGenerationResult("not json at all", "medium");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("не соответствует формату");
    }
  });
});
