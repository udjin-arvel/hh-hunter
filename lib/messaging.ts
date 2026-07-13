import { toAppError } from "./errors";
import {
  cancelGenerateLetterMessageSchema,
  cancelGenerateLetterResponseSchema,
  fetchVacancyMessageSchema,
  fetchVacancyResponseSchema,
  generateLetterMessageSchema,
  generateLetterResponseSchema,
  importPortfolioMessageSchema,
  importPortfolioResponseSchema,
  verifyApiKeyMessageSchema,
  verifyApiKeyResponseSchema,
} from "./schemas";
import type { AppError, GenerationResult, GenerationSettings, Profile, Vacancy } from "./types";

export async function importPortfolioFromUrl(url: string): Promise<string> {
  const message = importPortfolioMessageSchema.parse({
    type: "import_portfolio",
    url,
  });

  const response = await browser.runtime.sendMessage(message);
  const parsed = importPortfolioResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw toAppError(new Error("Некорректный ответ service worker"));
  }

  if (!parsed.data.ok) {
    throw parsed.data.error;
  }

  return parsed.data.text;
}

export async function fetchVacancyById(vacancyId: string, sourceUrl?: string): Promise<Vacancy> {
  const message = fetchVacancyMessageSchema.parse({
    type: "fetch_vacancy",
    vacancyId,
    sourceUrl,
  });

  const response = await browser.runtime.sendMessage(message);
  const parsed = fetchVacancyResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw toAppError(new Error("Некорректный ответ service worker"));
  }

  if (!parsed.data.ok) {
    throw parsed.data.error;
  }

  return parsed.data.vacancy;
}

export async function verifyApiKey(apiKey: string): Promise<void> {
  const message = verifyApiKeyMessageSchema.parse({
    type: "verify_api_key",
    apiKey,
  });

  const response = await browser.runtime.sendMessage(message);
  const parsed = verifyApiKeyResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw toAppError(new Error("Некорректный ответ service worker"));
  }

  if (!parsed.data.ok) {
    throw parsed.data.error;
  }
}

export async function generateLetterFromContext(
  apiKey: string,
  profile: Profile,
  vacancy: Vacancy,
  settings: GenerationSettings,
): Promise<GenerationResult> {
  const message = generateLetterMessageSchema.parse({
    type: "generate_letter",
    apiKey,
    profile,
    vacancy,
    settings,
  });

  const response = await browser.runtime.sendMessage(message);
  const parsed = generateLetterResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw toAppError(new Error("Некорректный ответ service worker"));
  }

  if (!parsed.data.ok) {
    throw parsed.data.error;
  }

  return parsed.data.result;
}

export async function cancelGenerationRequest(): Promise<void> {
  const message = cancelGenerateLetterMessageSchema.parse({
    type: "cancel_generate_letter",
  });

  const response = await browser.runtime.sendMessage(message);
  const parsed = cancelGenerateLetterResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw toAppError(new Error("Некорректный ответ service worker"));
  }
}

export function getErrorMessage(error: unknown): string {
  const appError = toAppError(error);
  return (appError as AppError).message;
}
