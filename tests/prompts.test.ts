import { describe, expect, it } from "vitest";

import {
  buildGenerationRequest,
  buildProfileCompressUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  MAX_EXAMPLE_PROMPT_CHARS,
  MAX_PORTFOLIO_PROMPT_CHARS,
  MAX_PROFILE_COMPRESS_INPUT_CHARS,
  MAX_USER_FOCUS_CHARS,
  PROFILE_COMPRESS_SYSTEM_PROMPT,
  resolveSelectedExamples,
  SYSTEM_PROMPT,
  VACANCY_LANGUAGE_RULE,
} from "@/lib/prompts";
import type { GenerationSettings, LetterExample, Profile, Vacancy } from "@/lib/types";

const profile: Profile = {
  name: "Александр Иванов",
  portfolioLink: "https://example.com",
  portfolioText:
    "Опыт продуктового дизайна более 5 лет. Вёл миграцию B2B-модуля на новую дизайн-систему.",
  technologiesToStudy: [],
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
  length: "medium",
  focus: "Акцент на управлении командами",
  fantasy: "medium",
  exampleIds: [],
  includeTheses: true,
  includeHiddenKeys: true,
  includeTechnologies: true,
};

const example: LetterExample = {
  id: "ex-1",
  title: "Продуктовая команда",
  letter: "Пример удачного письма с конкретикой и прямым тоном.",
  favorite: true,
};

describe("buildUserPrompt", () => {
  it("includes all substituted fields", () => {
    const prompt = buildUserPrompt(profile, vacancy, settings);

    expect(prompt).toContain("Александр Иванов");
    expect(prompt).toContain("Тинькофф");
    expect(prompt).toContain("крупный бизнес");
    expect(prompt).toContain("Продуктовый дизайнер");
    expect(prompt).toContain("Figma, UX-research");
    expect(prompt).toContain("Деловой");
    expect(prompt).toContain("примерно 100 слов");
    expect(prompt).toContain("Акцент на управлении командами");
    expect(prompt).toContain("Уровень фантазии: средний");
    expect(prompt).toContain("theses");
    expect(prompt).toContain(VACANCY_LANGUAGE_RULE);
  });

  it("includes fantasy level instructions", () => {
    const lowPrompt = buildUserPrompt(profile, vacancy, { ...settings, fantasy: "low" });
    const highPrompt = buildUserPrompt(profile, vacancy, { ...settings, fantasy: "high" });

    expect(lowPrompt).toContain("низкий");
    expect(lowPrompt).toContain("Ничего не выдумывай");
    expect(highPrompt).toContain("высокий");
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

  it("includes selected examples", () => {
    const prompt = buildUserPrompt(profile, vacancy, settings, [example]);

    expect(prompt).toContain("<untrusted_example_1>");
    expect(prompt).toContain("Продуктовая команда");
    expect(prompt).toContain("не копируй дословно");
  });

  it("truncates long example text", () => {
    const longExample: LetterExample = {
      ...example,
      letter: "в".repeat(MAX_EXAMPLE_PROMPT_CHARS + 100),
    };

    const prompt = buildUserPrompt(profile, vacancy, settings, [longExample]);
    const match = prompt.match(/<untrusted_example_1>\n([\s\S]*?)\n<\/untrusted_example_1>/);

    const body = match?.[1] ?? "";
    expect(body.length).toBeLessThanOrEqual(
      `Заголовок: ${longExample.title}\n`.length + MAX_EXAMPLE_PROMPT_CHARS,
    );
  });

  it("omits optional blocks from the prompt when disabled", () => {
    const disabled = {
      ...settings,
      includeTheses: false,
      includeHiddenKeys: false,
      includeTechnologies: false,
    };
    const prompt = buildUserPrompt(profile, vacancy, disabled);
    const system = buildSystemPrompt(disabled);

    expect(prompt).not.toContain("theses");
    expect(prompt).not.toContain("hidden_keys");
    expect(prompt).not.toContain("technologies");
    expect(prompt).not.toContain("Тезисы");
    expect(prompt).toContain("unique_intersection");
    expect(prompt).toContain("текст отклика (letter)");
    expect(system).not.toContain("theses");
    expect(system).not.toContain("hidden_keys");
    expect(system).not.toContain("technologies");
    expect(system).toContain('"letter"');
  });

  it("includes only the enabled optional blocks", () => {
    const thesesOnly = buildUserPrompt(profile, vacancy, {
      ...settings,
      includeHiddenKeys: false,
    });
    const keysOnly = buildUserPrompt(profile, vacancy, {
      ...settings,
      includeTheses: false,
    });
    const techOnly = buildUserPrompt(profile, vacancy, {
      ...settings,
      includeHiddenKeys: false,
      includeTheses: false,
    });

    expect(thesesOnly).toContain("theses");
    expect(thesesOnly).not.toContain("hidden_keys");
    expect(keysOnly).toContain("hidden_keys");
    expect(keysOnly).not.toContain("theses");
    expect(techOnly).toContain("technologies");
    expect(techOnly).not.toContain("hidden_keys");
  });

  it("adds short-letter rules for краткое письмо", () => {
    const prompt = buildUserPrompt(profile, vacancy, { ...settings, length: "short" });

    expect(prompt).toContain("примерно 50 слов");
    expect(prompt).toContain("коротко и по делу");
    expect(prompt).toContain("Здравствуйте. Я");
    expect(prompt).toContain("Добрый день, я");
  });

  it("asks to write as a front or back developer for those vacancies", () => {
    const prompt = buildUserPrompt(profile, vacancy, settings);

    expect(prompt).toContain("фронтенд-разработчика");
    expect(prompt).toContain("бэкенд-разработчика");
  });
});

describe("resolveSelectedExamples", () => {
  it("filters examples by id", () => {
    const all = [
      example,
      { ...example, id: "ex-2", title: "Другое", favorite: false },
    ];

    const selected = resolveSelectedExamples(all, ["ex-2"]);

    expect(selected).toHaveLength(1);
    expect(selected[0]?.id).toBe("ex-2");
  });
});

describe("SYSTEM_PROMPT", () => {
  it("requires letter, theses and business tone", () => {
    expect(SYSTEM_PROMPT).toContain("живой человек");
    expect(SYSTEM_PROMPT).toContain("деловой");
    expect(SYSTEM_PROMPT).toContain("theses");
    expect(SYSTEM_PROMPT).toContain("hidden_keys");
    expect(SYSTEM_PROMPT).toContain("technologies");
    expect(SYSTEM_PROMPT).toContain("уровень фантазии");
    expect(SYSTEM_PROMPT).toContain("преимущественно на английском");
    expect(SYSTEM_PROMPT).toContain("только на русском");
    expect(SYSTEM_PROMPT).toContain("Здравствуйте. Я");
    expect(SYSTEM_PROMPT).toContain("мета-фраз");
    expect(SYSTEM_PROMPT).toContain("длинное тире");
    expect(SYSTEM_PROMPT).toContain("в чате");
    expect(SYSTEM_PROMPT).toContain("рубленые фразы");
    expect(SYSTEM_PROMPT).toContain("высоконагруженный");
    expect(SYSTEM_PROMPT).toContain("выстраивал процессы");
    expect(SYSTEM_PROMPT).toContain("Если интересно, можем продолжить общение");
    expect(SYSTEM_PROMPT).toContain("практические навыки");
    expect(SYSTEM_PROMPT).toContain("Не выдумывай метрики и проценты");
    expect(SYSTEM_PROMPT).toContain("фронтенд-разработчика");
    expect(SYSTEM_PROMPT).toContain("бэкенд-разработчика");
    expect(SYSTEM_PROMPT).not.toContain("сопроводительное письмо");
  });
});

describe("buildGenerationRequest", () => {
  it("is deterministic for the same inputs", () => {
    const first = buildGenerationRequest(profile, vacancy, settings);
    const second = buildGenerationRequest(profile, vacancy, settings);

    expect(first).toEqual(second);
  });

  it("returns a valid generation request", () => {
    const request = buildGenerationRequest(profile, vacancy, settings, [example]);

    expect(request.system).toBe(SYSTEM_PROMPT);
    expect(request.model).toBe("deepseek-chat");
    expect(request.temperature).toBe(0.7);
    expect(request.response_format).toEqual({ type: "json_object" });
    expect(request.user).toContain("Александр Иванов");
    expect(request.user).toContain("Продуктовая команда");
  });

  it("drops optional blocks from the system prompt when disabled", () => {
    const request = buildGenerationRequest(profile, vacancy, {
      ...settings,
      includeTheses: false,
      includeHiddenKeys: false,
      includeTechnologies: false,
    });

    expect(request.system).not.toContain("theses");
    expect(request.system).not.toContain("hidden_keys");
    expect(request.system).not.toContain("technologies");
  });
});

describe("buildProfileCompressUserPrompt", () => {
  it("wraps resume text in untrusted tags", () => {
    const prompt = buildProfileCompressUserPrompt("Опыт разработки на TypeScript.");

    expect(prompt).toContain("<untrusted_resume_raw>");
    expect(prompt).toContain("Опыт разработки на TypeScript.");
  });

  it("truncates very long input", () => {
    const prompt = buildProfileCompressUserPrompt("а".repeat(MAX_PROFILE_COMPRESS_INPUT_CHARS + 500));

    expect(prompt.length).toBeLessThan(MAX_PROFILE_COMPRESS_INPUT_CHARS + 200);
  });

  it("uses a dedicated system prompt constant", () => {
    expect(PROFILE_COMPRESS_SYSTEM_PROMPT).toContain("резюме");
  });
});
