import { createAppError } from "./errors";
import { isInformativeText } from "./html";
import { generationResultSchema } from "./schemas";
import type {
  AppError,
  GenerationResult,
  GenerationSettings,
  LetterLength,
  Profile,
  Vacancy,
} from "./types";
import {
  getLetterWordRange,
  HIDDEN_KEYS_COUNT_MAX,
  HIDDEN_KEYS_COUNT_MIN,
  THESES_COUNT_MAX,
  THESES_COUNT_MIN,
} from "./types";

export interface GenerationOutputOptions {
  includeTheses: boolean;
  includeHiddenKeys: boolean;
}

const DEFAULT_GENERATION_OUTPUT: GenerationOutputOptions = {
  includeTheses: true,
  includeHiddenKeys: true,
};

const MIN_PROFILE_CHARS = 100;

export function getDisplayLetter(letterDraft: string | null, letter: string): string {
  return letterDraft ?? letter;
}

export function formatThesesForDisplay(theses: string[]): string {
  return theses.join("\n");
}

export function parseThesesFromDisplay(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function countWords(text: string): number {
  const normalized = text.trim();

  if (!normalized) {
    return 0;
  }

  return normalized.split(/\s+/).filter(Boolean).length;
}

export function countThesesLines(text: string): number {
  return parseThesesFromDisplay(text).length;
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

  const candidateText = profile.portfolioText.trim();

  if (!isInformativeText(candidateText, MIN_PROFILE_CHARS)) {
    return {
      ok: false,
      error: createAppError(
        "VALIDATION",
        "Сохраните резюме на вкладке «Профиль» (минимум 100 символов).",
      ),
    };
  }

  return { ok: true };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function applyOutputOptions(value: unknown, output: GenerationOutputOptions): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const next = { ...value };

  if (!output.includeHiddenKeys) {
    delete next.hidden_keys;
  }

  if (!output.includeTheses) {
    delete next.theses;
  }

  return next;
}

export function validateGenerationResult(
  value: unknown,
  expectedLength: LetterLength,
  output: GenerationOutputOptions = DEFAULT_GENERATION_OUTPUT,
): { ok: true; result: GenerationResult } | { ok: false; error: AppError } {
  const parsed = generationResultSchema.safeParse(applyOutputOptions(value, output));

  if (!parsed.success) {
    return {
      ok: false,
      error: createAppError("VALIDATION", "Ответ модели не соответствует формату.", parsed.error),
    };
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

  if (output.includeHiddenKeys) {
    const hiddenKeysCount = parsed.data.hidden_keys.length;

    if (hiddenKeysCount < HIDDEN_KEYS_COUNT_MIN || hiddenKeysCount > HIDDEN_KEYS_COUNT_MAX) {
      return {
        ok: false,
        error: createAppError(
          "VALIDATION",
          `Количество скрытых ключей (${hiddenKeysCount}) должно быть от ${HIDDEN_KEYS_COUNT_MIN} до ${HIDDEN_KEYS_COUNT_MAX}.`,
        ),
      };
    }
  }

  if (output.includeTheses) {
    const thesesCount = parsed.data.theses.length;

    if (thesesCount < THESES_COUNT_MIN || thesesCount > THESES_COUNT_MAX) {
      return {
        ok: false,
        error: createAppError(
          "VALIDATION",
          `Количество тезисов (${thesesCount}) должно быть от ${THESES_COUNT_MIN} до ${THESES_COUNT_MAX}.`,
        ),
      };
    }
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
  output: GenerationOutputOptions = DEFAULT_GENERATION_OUTPUT,
): { ok: true; result: GenerationResult } | { ok: false; error: AppError } {
  const value = extractJsonValue(raw);

  if (value === null) {
    return {
      ok: false,
      error: createAppError("VALIDATION", "Ответ модели не соответствует формату."),
    };
  }

  return validateGenerationResult(value, expectedLength, output);
}
