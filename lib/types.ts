import type { z } from "zod";

import { generationSettingsSchema, persistedStateSchema, profileSchema } from "./schemas";
import type {
  appErrorCodeSchema,
  appErrorSchema,
  backgroundPingMessageSchema,
  backgroundPongResponseSchema,
  generationRequestSchema,
  generationResultSchema,
  letterLengthSchema,
  letterStyleSchema,
  responseFormatSchema,
  tabKeySchema,
  vacancySchema,
} from "./schemas";

export type AppErrorCode = z.infer<typeof appErrorCodeSchema>;
export type AppError = z.infer<typeof appErrorSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Vacancy = z.infer<typeof vacancySchema>;
export type LetterStyle = z.infer<typeof letterStyleSchema>;
export type LetterLength = z.infer<typeof letterLengthSchema>;
export type ResponseFormat = z.infer<typeof responseFormatSchema>;
export type GenerationSettings = z.infer<typeof generationSettingsSchema>;
export type GenerationResult = z.infer<typeof generationResultSchema>;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;
export type BackgroundPingMessage = z.infer<typeof backgroundPingMessageSchema>;
export type BackgroundPongResponse = z.infer<typeof backgroundPongResponseSchema>;
export type TabKey = z.infer<typeof tabKeySchema>;
export type PersistedState = z.infer<typeof persistedStateSchema>;

export type GenerationStage = "idle" | "analyzing" | "intersection" | "writing";

export const DEFAULT_PROFILE: Profile = profileSchema.parse({});
export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = generationSettingsSchema.parse({});

export const DEFAULT_PERSISTED_STATE: PersistedState = persistedStateSchema.parse({
  version: 2,
  profile: DEFAULT_PROFILE,
  settings: DEFAULT_GENERATION_SETTINGS,
  ui: { activeTab: "generator" },
});

export const RESPONSE_FORMAT_LABELS: Record<ResponseFormat, string> = {
  letter: "Готовое письмо",
  theses: "Тезисы",
};

export const LETTER_STYLE_LABELS: Record<LetterStyle, string> = {
  conversational: "Разговорный",
  business: "Деловой",
  metrics: "С акцентом на цифры",
};

export const LETTER_LENGTH_LABELS: Record<LetterLength, string> = {
  short: "Краткое",
  medium: "Среднее",
  long: "Подробное",
};

export const LETTER_WORD_TARGETS: Record<LetterLength, number> = {
  short: 50,
  medium: 100,
  long: 180,
};

export const LETTER_WORD_TOLERANCE = 0.4;

export const THESES_LINE_RANGES: Record<LetterLength, { min: number; max: number }> = {
  short: { min: 4, max: 6 },
  medium: { min: 6, max: 9 },
  long: { min: 8, max: 12 },
};

export function getLetterWordRange(length: LetterLength): { min: number; max: number } {
  const target = LETTER_WORD_TARGETS[length];
  const tolerance = Math.floor(target * LETTER_WORD_TOLERANCE);

  return {
    min: target - tolerance,
    max: target + tolerance,
  };
}

export function getThesesLineRange(length: LetterLength): { min: number; max: number } {
  return THESES_LINE_RANGES[length];
}
