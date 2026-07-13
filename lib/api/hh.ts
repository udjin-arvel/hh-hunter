import { z } from "zod";

import { createAppError } from "../errors";
import { getHhBrowserHeaders } from "../hh-config";
import { parseVacancyFromHtml } from "../hh-page";
import { stripHtmlToText } from "../html";
import type { Vacancy } from "../types";

export const HH_FETCH_TIMEOUT_MS = 10_000;
export const MAX_VACANCY_DESCRIPTION_CHARS = 3000;

export const hhVacancyResponseSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  name: z.string(),
  description: z.string().optional(),
  key_skills: z.array(z.object({ name: z.string() })).optional(),
  experience: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
  employment: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
  schedule: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
  employer: z
    .object({
      name: z.string(),
      type: z.string().optional(),
    })
    .nullable()
    .optional(),
  alternate_url: z.string().url().optional(),
});

export type HhVacancyResponse = z.infer<typeof hhVacancyResponseSchema>;

type TabScrapeResult = { ok: true; data: unknown } | { ok: false; status: number };

export function mapCompanyType(employerType?: string | null): string {
  if (!employerType) {
    return "";
  }

  const normalized = employerType.toLowerCase();

  if (normalized.includes("agency") || normalized.includes("startup")) {
    return "стартап";
  }

  if (normalized.includes("company") || normalized.includes("private")) {
    return "крупный бизнес";
  }

  if (normalized.includes("government") || normalized.includes("state")) {
    return "госсектор";
  }

  return "";
}

export function mapEmployment(
  schedule?: { name: string } | null,
  employment?: { name: string } | null,
): string {
  return schedule?.name ?? employment?.name ?? "";
}

export function truncateVacancyDescription(
  text: string,
  limit = MAX_VACANCY_DESCRIPTION_CHARS,
): string {
  const normalized = text.trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return normalized.slice(0, limit);
}

export function mapHhVacancyToLocal(api: HhVacancyResponse, sourceUrl?: string): Vacancy {
  const description = truncateVacancyDescription(stripHtmlToText(api.description ?? ""));

  return {
    id: api.id,
    title: api.name,
    company_name: api.employer?.name ?? "Неизвестная компания",
    company_type: mapCompanyType(api.employer?.type),
    description,
    key_skills: (api.key_skills ?? []).map((skill) => skill.name),
    experience_required: api.experience?.name ?? "",
    employment: mapEmployment(api.schedule, api.employment),
    url: sourceUrl ?? api.alternate_url,
  };
}

export function mapHhHttpStatusToError(status: number) {
  if (status === 404) {
    return createAppError("NOT_FOUND", "Вакансия не найдена или недоступна");
  }

  if (status === 403) {
    return createAppError(
      "UNAUTHORIZED",
      "HeadHunter заблокировал загрузку. Откройте страницу вакансии на hh.ru и нажмите «Сканировать».",
    );
  }

  if (status === 429) {
    return createAppError("RATE_LIMIT", "Превышен лимит запросов к HH. Попробуйте позже.");
  }

  if (status >= 500) {
    return createAppError("NETWORK", `Сервер HH вернул ошибку ${status}.`);
  }

  return createAppError("NETWORK", `Не удалось загрузить вакансию (код ${status}).`);
}

export function mapHhFetchError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return createAppError("TIMEOUT", "Превышено время ожидания ответа от HH.");
  }

  if (error instanceof TypeError) {
    return createAppError("NETWORK", "Не удалось подключиться к HeadHunter.", error);
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    return error as ReturnType<typeof createAppError>;
  }

  return createAppError("UNKNOWN", "Не удалось загрузить вакансию.", error);
}

function parseHhVacancyPayload(payload: unknown, sourceUrl?: string): Vacancy {
  const parsed = hhVacancyResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw createAppError(
      "VALIDATION",
      "Не удалось разобрать данные вакансии с hh.ru.",
      parsed.error,
    );
  }

  return mapHhVacancyToLocal(parsed.data, sourceUrl);
}

function scrapeVacancyOnHhPage(vacancyId: string): TabScrapeResult {
  const normalizeText = (value: string) =>
    value
      .replace(/[\u200B-\u200F\uFEFF\u2060\u202A-\u202E]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const readText = (selectors: string[]) => {
    for (const selector of selectors) {
      const text = document.querySelector(selector)?.textContent;

      if (text) {
        const normalized = normalizeText(text);

        if (normalized) {
          return normalized;
        }
      }
    }

    return "";
  };

  const readHtml = (selectors: string[]) => {
    for (const selector of selectors) {
      const html = document.querySelector(selector)?.innerHTML?.trim();

      if (html) {
        return html;
      }
    }

    return "";
  };

  const pathId = window.location.pathname.match(/\/vacancy\/(\d+)/i)?.[1];

  if (pathId && pathId !== vacancyId) {
    return { ok: false, status: 0 };
  }

  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const parsed = JSON.parse(script.textContent ?? "") as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        if (
          typeof item === "object" &&
          item !== null &&
          "@type" in item &&
          item["@type"] === "JobPosting"
        ) {
          const record = item as Record<string, unknown>;
          const title = typeof record.title === "string" ? normalizeText(record.title) : "";
          const description = typeof record.description === "string" ? record.description : "";
          const hiringOrganization =
            typeof record.hiringOrganization === "object" && record.hiringOrganization !== null
              ? (record.hiringOrganization as Record<string, unknown>)
              : null;
          const companyName =
            typeof hiringOrganization?.name === "string"
              ? normalizeText(hiringOrganization.name)
              : "";

          if (title) {
            return {
              ok: true,
              data: {
                id: vacancyId,
                name: title,
                description,
                employer: companyName ? { name: companyName } : null,
                key_skills: [],
              },
            };
          }
        }
      }
    } catch {
      // Ignore invalid JSON-LD.
    }
  }

  const luxTemplate = document.querySelector("#HH-Lux-InitialState");
  const luxRaw = luxTemplate?.textContent?.trim();

  if (luxRaw) {
    try {
      const findVacancyNode = (node: unknown, depth = 0): Record<string, unknown> | null => {
        if (!node || typeof node !== "object" || depth > 12) {
          return null;
        }

        const record = node as Record<string, unknown>;

        if ("vacancyId" in record && typeof record.name === "string") {
          return record;
        }

        for (const value of Object.values(record)) {
          if (typeof value === "object") {
            const found = findVacancyNode(value, depth + 1);

            if (found) {
              return found;
            }
          }
        }

        return null;
      };

      const state = JSON.parse(luxRaw.replace(/&#34;/g, '"')) as unknown;
      const vacancy = findVacancyNode(state);

      if (vacancy && String(vacancy.vacancyId ?? vacancyId) === vacancyId) {
        const title = typeof vacancy.name === "string" ? normalizeText(vacancy.name) : "";
        const company =
          typeof vacancy.company === "object" && vacancy.company !== null
            ? (vacancy.company as Record<string, unknown>)
            : null;
        const companyName =
          typeof company?.visibleName === "string"
            ? normalizeText(company.visibleName)
            : typeof company?.name === "string"
              ? normalizeText(company.name)
              : "";
        const decodeHtml = (value: string) => {
          const textarea = document.createElement("textarea");
          textarea.innerHTML = value;
          return textarea.value;
        };
        const description =
          typeof vacancy.description === "string" ? decodeHtml(vacancy.description) : "";

        if (title) {
          return {
            ok: true,
            data: {
              id: vacancyId,
              name: title,
              description,
              employer: companyName ? { name: companyName } : null,
              key_skills: [],
            },
          };
        }
      }
    } catch {
      // Ignore invalid Lux state.
    }
  }

  const title = readText(['[data-qa="vacancy-title"]', "h1"]);
  const company = readText([
    '[data-qa="vacancy-company-name"]',
    '[data-qa="vacancy-view-employee-name"]',
    'a[data-qa="vacancy-company-name"]',
  ]);
  const description = readHtml([
    '[data-qa="vacancy-description"]',
    ".vacancy-description",
    '[class*="vacancy-description"]',
  ]);
  const experience = readText(['[data-qa="vacancy-experience"]']);
  const employment = readText([
    '[data-qa="vacancy-view-employment-mode"]',
    '[data-qa="vacancy-view-employment-mode-text"]',
  ]);
  const schedule = readText([
    '[data-qa="vacancy-view-work-schedule-schedule"]',
    '[data-qa="vacancy-view-schedule"]',
  ]);
  const skills = [
    ...new Set(
      [...document.querySelectorAll('[data-qa="bloko-tag__text"], [data-qa="skills-element"]')]
        .map((element) => normalizeText(element.textContent ?? ""))
        .filter(Boolean),
    ),
  ].slice(0, 30);

  if (!title) {
    return { ok: false, status: 0 };
  }

  return {
    ok: true,
    data: {
      id: vacancyId,
      name: title,
      description,
      employer: company ? { name: company } : null,
      key_skills: skills.map((name) => ({ name })),
      experience: experience ? { id: "unknown", name: experience } : null,
      employment: employment ? { id: "unknown", name: employment } : null,
      schedule: schedule ? { id: "unknown", name: schedule } : null,
    },
  };
}

function resolveVacancyPageUrl(vacancyId: string, sourceUrl?: string): string {
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);

      if (url.hostname.endsWith("hh.ru")) {
        return url.toString();
      }
    } catch {
      // Fall through to default URL.
    }
  }

  return `https://hh.ru/vacancy/${vacancyId}`;
}

export async function fetchHhVacancyFromWebsite(
  vacancyId: string,
  sourceUrl?: string,
): Promise<Vacancy> {
  const pageUrl = resolveVacancyPageUrl(vacancyId, sourceUrl);
  let response: Response;

  try {
    response = await fetch(pageUrl, {
      method: "GET",
      headers: getHhBrowserHeaders(),
      redirect: "follow",
      signal: AbortSignal.timeout(HH_FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    throw mapHhFetchError(error);
  }

  if (!response.ok) {
    throw mapHhHttpStatusToError(response.status);
  }

  const html = await response.text();
  const scraped = parseVacancyFromHtml(html, vacancyId);

  if (!scraped) {
    throw createAppError(
      "VALIDATION",
      "Не удалось извлечь данные вакансии со страницы hh.ru. Откройте вакансию в браузере и нажмите «Сканировать».",
    );
  }

  return parseHhVacancyPayload(scraped, sourceUrl ?? pageUrl);
}

export async function fetchHhVacancyViaTab(
  tabId: number,
  vacancyId: string,
  sourceUrl?: string,
): Promise<Vacancy> {
  let results;

  try {
    results = await browser.scripting.executeScript({
      target: { tabId },
      func: scrapeVacancyOnHhPage,
      args: [vacancyId],
    });
  } catch (error) {
    throw createAppError(
      "NETWORK",
      "Не удалось прочитать вакансию с открытой вкладки hh.ru. Обновите страницу и попробуйте снова.",
      error,
    );
  }

  const result = results[0]?.result as TabScrapeResult | undefined;

  if (!result?.ok) {
    throw createAppError(
      "VALIDATION",
      "Не удалось извлечь вакансию со страницы. Убедитесь, что открыта страница вакансии на hh.ru.",
    );
  }

  return parseHhVacancyPayload(result.data, sourceUrl);
}

export async function fetchHhVacancy(vacancyId: string, sourceUrl?: string): Promise<Vacancy> {
  return fetchHhVacancyFromWebsite(vacancyId, sourceUrl);
}
