import { createAppError } from "./errors";
import { isInformativeText } from "./html";
import { generationResultSchema } from "./schemas";
import type {
  AppError,
  GenerationResult,
  GenerationSettings,
  LetterLength,
  Profile,
  ResponseFormat,
  Vacancy,
} from "./types";
import { getLetterWordRange } from "./types";

const MIN_PROFILE_CHARS = 100;

export function getDisplayLetter(letterDraft: string | null, letter: string): string {
  return letterDraft ?? letter;
}

export function countWords(text: string): number {
  const normalized = text.trim();

  if (!normalized) {
    return 0;
  }

  return normalized.split(/\s+/).filter(Boolean).length;
}

export function countThesesLines(text: string): number {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

export function validateGenerationInput(
  profile: Profile,
  vacancy: Vacancy | null,
  _settings: GenerationSettings,
): { ok: true } | { ok: false; error: AppError } {
  if (!vacancy) {
    return {
      ok: false,
      error: createAppError("VALIDATION", "Загрузите вакансию перед генерацией."),
    };
  }

  const candidateText = profile.portfolioText.trim() || profile.achievements.trim();

  if (!isInformativeText(candidateText, MIN_PROFILE_CHARS)) {
    return {
      ok: false,
      error: createAppError(
        "VALIDATION",
        "Заполните достижения или импортируйте портфолио (минимум 100 символов).",
      ),
    };
  }

  return { ok: true };
}

export function validateGenerationResult(
  value: unknown,
  expectedLength: LetterLength,
  format: ResponseFormat = "letter",
): { ok: true; result: GenerationResult } | { ok: false; error: AppError } {
  const parsed = generationResultSchema.safeParse(value);

  if (!parsed.success) {
    return {
      ok: false,
      error: createAppError("VALIDATION", "Ответ модели не соответствует формату.", parsed.error),
    };
  }

  if (format === "theses") {
    return { ok: true, result: parsed.data };
  }

  const wordCount = countWords(parsed.data.letter);
  const { min, max } = getLetterWordRange(expectedLength);

  if (wordCount < min || wordCount > max) {
    return {
      ok: false,
      error: createAppError(
        "VALIDATION",
        `Длина письма (${wordCount} слов) не соответствует настройке (${min}–${max} слов).`,
      ),
    };
  }

  return { ok: true, result: parsed.data };
}

function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw.trim()) as unknown;
  } catch {
    return null;
  }
}

function extractJsonFromMarkdownFence(raw: string): unknown | null {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (!match?.[1]) {
    return null;
  }

  return tryParseJson(match[1]);
}

function extractJsonObject(raw: string): unknown | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return tryParseJson(raw.slice(start, end + 1));
}

function extractJsonValue(raw: string): unknown | null {
  return tryParseJson(raw) ?? extractJsonFromMarkdownFence(raw) ?? extractJsonObject(raw);
}

export function parseGenerationResult(
  raw: string,
  expectedLength: LetterLength,
  format: ResponseFormat = "letter",
): { ok: true; result: GenerationResult } | { ok: false; error: AppError } {
  const value = extractJsonValue(raw);

  if (value === null) {
    return {
      ok: false,
      error: createAppError("VALIDATION", "Ответ модели не соответствует формату."),
    };
  }

  return validateGenerationResult(value, expectedLength, format);
}
