import { describe, expect, it } from "vitest";

import {
  mapCompanyType,
  mapEmployment,
  mapHhHttpStatusToError,
  mapHhVacancyToLocal,
  truncateVacancyDescription,
  type HhVacancyResponse,
} from "./hh";

const baseApiResponse: HhVacancyResponse = {
  id: "128456712",
  name: "Продуктовый дизайнер",
  description: "<p>Опыт работы с <strong>Figma</strong>.</p>",
  key_skills: [{ name: "Figma" }, { name: "UX-research" }],
  experience: { id: "between3And6", name: "3–6 лет" },
  schedule: { id: "remote", name: "Удаленная работа" },
  employment: { id: "full", name: "Полная занятость" },
  employer: {
    name: "Тинькофф",
    type: "company",
  },
  alternate_url: "https://hh.ru/vacancy/128456712",
};

describe("mapHhVacancyToLocal", () => {
  it("maps api response to local vacancy", () => {
    const vacancy = mapHhVacancyToLocal(baseApiResponse, "https://hh.ru/vacancy/128456712");

    expect(vacancy.id).toBe("128456712");
    expect(vacancy.title).toBe("Продуктовый дизайнер");
    expect(vacancy.company_name).toBe("Тинькофф");
    expect(vacancy.company_type).toBe("крупный бизнес");
    expect(vacancy.description).toBe("Опыт работы с Figma .");
    expect(vacancy.key_skills).toEqual(["Figma", "UX-research"]);
    expect(vacancy.experience_required).toBe("3–6 лет");
    expect(vacancy.employment).toBe("Удаленная работа");
    expect(vacancy.url).toBe("https://hh.ru/vacancy/128456712");
  });

  it("falls back to employment when schedule is missing", () => {
    const vacancy = mapHhVacancyToLocal({
      ...baseApiResponse,
      schedule: null,
    });

    expect(vacancy.employment).toBe("Полная занятость");
  });
});

describe("mapCompanyType", () => {
  it("maps known employer types", () => {
    expect(mapCompanyType("company")).toBe("крупный бизнес");
    expect(mapCompanyType("agency")).toBe("стартап");
    expect(mapCompanyType("government")).toBe("госсектор");
  });
});

describe("mapEmployment", () => {
  it("prefers schedule over employment", () => {
    expect(mapEmployment({ name: "Гибрид" }, { name: "Полная занятость" })).toBe("Гибрид");
  });
});

describe("truncateVacancyDescription", () => {
  it("truncates long descriptions", () => {
    const text = "a".repeat(3100);
    expect(truncateVacancyDescription(text, 3000)).toHaveLength(3000);
  });
});

describe("mapHhHttpStatusToError", () => {
  it("maps common statuses", () => {
    expect(mapHhHttpStatusToError(403).code).toBe("UNAUTHORIZED");
    expect(mapHhHttpStatusToError(404).code).toBe("NOT_FOUND");
    expect(mapHhHttpStatusToError(429).code).toBe("RATE_LIMIT");
    expect(mapHhHttpStatusToError(503).code).toBe("NETWORK");
  });
});
