import { z } from "zod";

import { createAppError } from "../errors";
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

  if (status === 429) {
    return createAppError("RATE_LIMIT", "Превышен лимит запросов к HH API. Попробуйте позже.");
  }

  if (status >= 500) {
    return createAppError("NETWORK", `Сервер HH вернул ошибку ${status}.`);
  }

  return createAppError("NETWORK", `Не удалось загрузить вакансию (код ${status}).`);
}

export function mapHhFetchError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return createAppError("TIMEOUT", "Превышено время ожидания ответа от HH API.");
  }

  if (error instanceof TypeError) {
    return createAppError("NETWORK", "Не удалось подключиться к HH API.", error);
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    return error as ReturnType<typeof createAppError>;
  }

  return createAppError("UNKNOWN", "Не удалось загрузить вакансию.", error);
}

export async function fetchHhVacancy(vacancyId: string, sourceUrl?: string): Promise<Vacancy> {
  let response: Response;

  try {
    response = await fetch(`https://api.hh.ru/vacancies/${vacancyId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(HH_FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    throw mapHhFetchError(error);
  }

  if (!response.ok) {
    throw mapHhHttpStatusToError(response.status);
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    throw createAppError("VALIDATION", "HH API вернул некорректный JSON.", error);
  }

  const parsed = hhVacancyResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw createAppError(
      "VALIDATION",
      "Ответ HH API не соответствует ожидаемому формату.",
      parsed.error,
    );
  }

  return mapHhVacancyToLocal(parsed.data, sourceUrl);
}
