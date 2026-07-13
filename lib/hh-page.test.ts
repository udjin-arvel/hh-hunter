/**
 * @vitest-environment happy-dom
 */
import fs from "node:fs";
import { describe, expect, it } from "vitest";

import { parseVacancyFromHtml } from "./hh-page";

const sampleHtml = `<!DOCTYPE html>
<html>
  <body>
    <h1 data-qa="vacancy-title">Продуктовый дизайнер</h1>
    <a data-qa="vacancy-company-name">Тинькофф</a>
    <div data-qa="vacancy-description"><p>Опыт работы с <strong>Figma</strong>.</p></div>
    <span data-qa="vacancy-experience">Опыт 3–6 лет</span>
    <span data-qa="vacancy-view-employment-mode">Полная занятость</span>
    <span data-qa="vacancy-view-work-schedule-schedule">Удалённо</span>
    <span data-qa="bloko-tag__text">Figma</span>
    <span data-qa="bloko-tag__text">UX-research</span>
  </body>
</html>`;

describe("parseVacancyFromHtml", () => {
  it("extracts vacancy fields from hh.ru HTML", () => {
    const result = parseVacancyFromHtml(sampleHtml, "128456712");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("128456712");
    expect(result?.name).toBe("Продуктовый дизайнер");
    expect(result?.employer?.name).toBe("Тинькофф");
    expect(result?.description).toContain("Figma");
    expect(result?.key_skills).toEqual([{ name: "Figma" }, { name: "UX-research" }]);
    expect(result?.experience?.name).toBe("Опыт 3–6 лет");
    expect(result?.employment?.name).toBe("Полная занятость");
    expect(result?.schedule?.name).toBe("Удалённо");
  });

  it("returns null when title is missing", () => {
    expect(parseVacancyFromHtml("<html><body></body></html>", "1")).toBeNull();
  });

  it("parses a real hh.ru vacancy page snapshot", () => {
    const html = fs.readFileSync("lib/fixtures/hh-vacancy.html", "utf8");
    const result = parseVacancyFromHtml(html, "128456712");

    expect(result).not.toBeNull();
    expect(result?.name).toContain("Комплектовщик");
    expect(result?.employer?.name).toBe("Сервико");
    expect(result?.description).toContain("комплектовщик");
  });
});
