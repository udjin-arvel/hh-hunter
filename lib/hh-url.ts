import type { Vacancy } from "./types";

const HH_VACANCY_PATH_PATTERN = /\/vacancy\/(\d+)/i;
const HH_HOST_PATTERN = /(^|\.)hh\.ru$/i;
const RAW_VACANCY_ID_PATTERN = /^\d{6,12}$/;

function extractVacancyIdFromPath(pathname: string): string | null {
  const match = pathname.match(HH_VACANCY_PATH_PATTERN);
  return match?.[1] ?? null;
}

function isHhHostname(hostname: string): boolean {
  return HH_HOST_PATTERN.test(hostname.toLowerCase());
}

export function isHhVacancyUrl(url: string): boolean {
  return parseHhVacancyId(url) !== null;
}

export function parseHhVacancyId(input: string): string | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  if (RAW_VACANCY_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);

    if (!isHhHostname(url.hostname)) {
      return null;
    }

    return extractVacancyIdFromPath(url.pathname);
  } catch {
    return null;
  }
}

export function normalizeHhVacancyUrl(input: string): string | null {
  const vacancyId = parseHhVacancyId(input);

  if (!vacancyId) {
    return null;
  }

  if (input.trim().includes("://")) {
    try {
      const url = new URL(input.trim());
      if (isHhHostname(url.hostname)) {
        return url.toString();
      }
    } catch {
      return `https://hh.ru/vacancy/${vacancyId}`;
    }
  }

  return `https://hh.ru/vacancy/${vacancyId}`;
}

export function getVacancyReplyUrl(vacancy: Vacancy): string {
  if (vacancy.url) {
    return vacancy.url;
  }

  return `https://hh.ru/vacancy/${vacancy.id}`;
}
