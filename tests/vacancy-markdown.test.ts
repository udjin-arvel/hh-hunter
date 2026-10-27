/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";

import {
  buildVacancyMarkdownFilename,
  formatVacancyAsMarkdown,
  sanitizeFilenamePart,
} from "@/lib/vacancy-markdown";
import type { Vacancy } from "@/lib/types";

const sampleVacancy: Vacancy = {
  id: "128456712",
  title: "Продуктовый дизайнер",
  company_name: "Тинькофф",
  company_type: "крупный бизнес",
  description: "Опыт работы с Figma.",
  key_skills: ["Figma", "UX"],
  experience_required: "3–6 лет",
  employment: "Удалённо",
  url: "https://hh.ru/vacancy/128456712",
};

describe("sanitizeFilenamePart", () => {
  it("removes invalid path characters and collapses spaces", () => {
    expect(sanitizeFilenamePart('Senior / Dev: "Lead"')).toBe("Senior_Dev_Lead");
  });
});

describe("buildVacancyMarkdownFilename", () => {
  it("uses id and title", () => {
    expect(buildVacancyMarkdownFilename(sampleVacancy)).toBe(
      "128456712_Продуктовый_дизайнер.md",
    );
  });
});

describe("formatVacancyAsMarkdown", () => {
  it("includes title, metadata, skills and description", () => {
    const markdown = formatVacancyAsMarkdown(sampleVacancy);

    expect(markdown).toContain("# Продуктовый дизайнер");
    expect(markdown).toContain("**Компания:** Тинькофф");
    expect(markdown).toContain("**Навыки:** Figma, UX");
    expect(markdown).toContain("## Описание");
    expect(markdown).toContain("Опыт работы с Figma.");
  });

  it("preserves formatting from vacancy HTML", () => {
    const markdown = formatVacancyAsMarkdown({
      ...sampleVacancy,
      description: "Первый абзац. Второй абзац.",
      description_html:
        "<p>Первый абзац.</p><p>Второй абзац.</p><ul><li>Пункт один</li><li>Пункт два</li></ul>",
    });

    expect(markdown).toContain("Первый абзац.\n\nВторой абзац.");
    expect(markdown).toContain("- Пункт один");
    expect(markdown).toContain("- Пункт два");
  });
});
