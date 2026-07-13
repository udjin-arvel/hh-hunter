import { describe, expect, it } from "vitest";

import {
  isHhVacancyUrl,
  normalizeHhVacancyUrl,
  parseHhVacancyId,
  getVacancyReplyUrl,
} from "./hh-url";

describe("parseHhVacancyId", () => {
  it("parses standard hh.ru vacancy urls", () => {
    expect(parseHhVacancyId("https://hh.ru/vacancy/128456712")).toBe("128456712");
    expect(parseHhVacancyId("https://spb.hh.ru/vacancy/128456712")).toBe("128456712");
    expect(parseHhVacancyId("https://hh.ru/vacancy/128456712?from=search")).toBe("128456712");
    expect(parseHhVacancyId("https://hh.ru/vacancy/128456712#reply")).toBe("128456712");
  });

  it("parses bare vacancy id", () => {
    expect(parseHhVacancyId("128456712")).toBe("128456712");
  });

  it("returns null for invalid inputs", () => {
    expect(parseHhVacancyId("https://hh.ru/employer/123")).toBeNull();
    expect(parseHhVacancyId("not-a-url")).toBeNull();
    expect(parseHhVacancyId("")).toBeNull();
  });
});

describe("isHhVacancyUrl", () => {
  it("detects vacancy urls", () => {
    expect(isHhVacancyUrl("https://hh.ru/vacancy/128456712")).toBe(true);
    expect(isHhVacancyUrl("https://hh.ru/employer/123")).toBe(false);
  });
});

describe("normalizeHhVacancyUrl", () => {
  it("normalizes id and url inputs", () => {
    expect(normalizeHhVacancyUrl("128456712")).toBe("https://hh.ru/vacancy/128456712");
    expect(normalizeHhVacancyUrl("https://spb.hh.ru/vacancy/128456712?from=search")).toBe(
      "https://spb.hh.ru/vacancy/128456712?from=search",
    );
  });
});

describe("getVacancyReplyUrl", () => {
  it("uses vacancy url when available", () => {
    expect(
      getVacancyReplyUrl({
        id: "128456712",
        title: "Designer",
        company_name: "ACME",
        company_type: "",
        description: "",
        key_skills: [],
        experience_required: "",
        employment: "",
        url: "https://hh.ru/vacancy/128456712?from=search",
      }),
    ).toBe("https://hh.ru/vacancy/128456712?from=search");
  });

  it("falls back to vacancy id", () => {
    expect(
      getVacancyReplyUrl({
        id: "128456712",
        title: "Designer",
        company_name: "ACME",
        company_type: "",
        description: "",
        key_skills: [],
        experience_required: "",
        employment: "",
      }),
    ).toBe("https://hh.ru/vacancy/128456712");
  });
});
