import { describe, expect, it } from "vitest";

import {
  buildGenerationRequest,
  buildUserPrompt,
  MAX_PORTFOLIO_PROMPT_CHARS,
  MAX_USER_FOCUS_CHARS,
  SYSTEM_PROMPT,
} from "./prompts";
import type { GenerationSettings, Profile, Vacancy } from "./types";

const profile: Profile = {
  name: "Александр Иванов",
  portfolioLink: "https://example.com",
  portfolioText:
    "Опыт продуктового дизайна более 5 лет. Вёл миграцию B2B-модуля на новую дизайн-систему.",
  achievements: "",
};

const vacancy: Vacancy = {
  id: "128456712",
  title: "Продуктовый дизайнер",
  company_name: "Тинькофф",
  company_type: "крупный бизнес",
  description: "Ищем дизайнера для развития дизайн-системы.",
  key_skills: ["Figma", "UX-research"],
  experience_required: "3–6 лет",
  employment: "Гибрид",
  url: "https://hh.ru/vacancy/128456712",
};

const settings: GenerationSettings = {
  format: "letter",
  style: "business",
  length: "medium",
  focus: "Акцент на управлении командами",
};

describe("buildUserPrompt", () => {
  it("includes all substituted fields", () => {
    const prompt = buildUserPrompt(profile, vacancy, settings);

    expect(prompt).toContain("Александр Иванов");
    expect(prompt).toContain("Тинькофф");
    expect(prompt).toContain("крупный бизнес");
    expect(prompt).toContain("Продуктовый дизайнер");
    expect(prompt).toContain("Figma, UX-research");
    expect(prompt).toContain("Готовое письмо");
    expect(prompt).toContain("Деловой");
    expect(prompt).toContain("Среднее");
    expect(prompt).toContain("примерно 100 слов");
    expect(prompt).toContain("Акцент на управлении командами");
  });

  it("includes theses format instructions", () => {
    const prompt = buildUserPrompt(profile, vacancy, { ...settings, format: "theses" });

    expect(prompt).toContain("Тезисы");
    expect(prompt).toContain("6–9 тезисов");
    expect(prompt).toContain("набор тезисов");
    expect(prompt).not.toContain("примерно 100 слов");
  });

  it("wraps untrusted content in delimiters", () => {
    const prompt = buildUserPrompt(profile, vacancy, settings);

    expect(prompt).toContain("<untrusted_portfolio_text>");
    expect(prompt).toContain("</untrusted_portfolio_text>");
    expect(prompt).toContain("<untrusted_vacancy_description>");
    expect(prompt).toContain("<untrusted_user_focus>");
  });

  it("truncates long portfolio text", () => {
    const longProfile: Profile = {
      ...profile,
      portfolioText: "а".repeat(MAX_PORTFOLIO_PROMPT_CHARS + 500),
    };

    const prompt = buildUserPrompt(longProfile, vacancy, settings);
    const match = prompt.match(
      /<untrusted_portfolio_text>\n([\s\S]*?)\n<\/untrusted_portfolio_text>/,
    );

    expect(match?.[1]).toHaveLength(MAX_PORTFOLIO_PROMPT_CHARS);
  });

  it("truncates long user focus", () => {
    const longFocusSettings: GenerationSettings = {
      ...settings,
      focus: "б".repeat(MAX_USER_FOCUS_CHARS + 100),
    };

    const prompt = buildUserPrompt(profile, vacancy, longFocusSettings);
    const match = prompt.match(/<untrusted_user_focus>\n([\s\S]*?)\n<\/untrusted_user_focus>/);

    expect(match?.[1]).toHaveLength(MAX_USER_FOCUS_CHARS);
  });

  it("uses achievements when portfolio text is empty", () => {
    const achievementsProfile: Profile = {
      ...profile,
      portfolioText: "",
      achievements: "Ключевые достижения в продуктовом дизайне и исследованиях.",
    };

    const prompt = buildUserPrompt(achievementsProfile, vacancy, settings);

    expect(prompt).toContain("Ключевые достижения в продуктовом дизайне");
  });

  it("adds short-letter rules for краткое письмо", () => {
    const prompt = buildUserPrompt(profile, vacancy, { ...settings, length: "short" });

    expect(prompt).toContain("примерно 50 слов");
    expect(prompt).toContain("коротко и по делу");
    expect(prompt).toContain("Добрый день");
    expect(prompt).toContain("меня заинтересовала ваша вакансия");
  });
});

describe("SYSTEM_PROMPT", () => {
  it("requires human-like tone, first-person intersection and 3–10 hidden keys", () => {
    expect(SYSTEM_PROMPT).toContain("живой человек");
    expect(SYSTEM_PROMPT).toContain("Меньше вежливости");
    expect(SYSTEM_PROMPT).toContain("прямоты");
    expect(SYSTEM_PROMPT).toContain("боль работодателя");
    expect(SYSTEM_PROMPT).toContain("смежные");
    expect(SYSTEM_PROMPT).toContain("hidden_keys");
    expect(SYSTEM_PROMPT).toContain("от первого лица");
    expect(SYSTEM_PROMPT).toContain("от 3 до 10");
    expect(SYSTEM_PROMPT).toContain("Тезисы");
  });
});

describe("buildGenerationRequest", () => {
  it("is deterministic for the same inputs", () => {
    const first = buildGenerationRequest(profile, vacancy, settings);
    const second = buildGenerationRequest(profile, vacancy, settings);

    expect(first).toEqual(second);
  });

  it("returns a valid generation request", () => {
    const request = buildGenerationRequest(profile, vacancy, settings);

    expect(request.system).toBe(SYSTEM_PROMPT);
    expect(request.model).toBe("deepseek-chat");
    expect(request.temperature).toBe(0.7);
    expect(request.response_format).toEqual({ type: "json_object" });
    expect(request.user).toContain("Александр Иванов");
  });
});
