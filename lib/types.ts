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
  tabKeySchema,
  vacancySchema,
} from "./schemas";

export type AppErrorCode = z.infer<typeof appErrorCodeSchema>;
export type AppError = z.infer<typeof appErrorSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Vacancy = z.infer<typeof vacancySchema>;
export type LetterStyle = z.infer<typeof letterStyleSchema>;
export type LetterLength = z.infer<typeof letterLengthSchema>;
export type GenerationSettings = z.infer<typeof generationSettingsSchema>;
export type GenerationResult = z.infer<typeof generationResultSchema>;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;
export type BackgroundPingMessage = z.infer<typeof backgroundPingMessageSchema>;
export type BackgroundPongResponse = z.infer<typeof backgroundPongResponseSchema>;
export type TabKey = z.infer<typeof tabKeySchema>;
export type PersistedState = z.infer<typeof persistedStateSchema>;

export type GenerationStage = "idle" | "analyzing" | "intersection" | "writing";
export type ApiKeyStatus = "unchecked" | "valid" | "invalid";

export const DEFAULT_PROFILE: Profile = profileSchema.parse({});
export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = generationSettingsSchema.parse({});

export const DEFAULT_PERSISTED_STATE: PersistedState = persistedStateSchema.parse({
  version: 1,
  profile: DEFAULT_PROFILE,
  settings: DEFAULT_GENERATION_SETTINGS,
  apiKey: "",
  ui: { activeTab: "generator" },
});

export const LETTER_STYLE_LABELS: Record<LetterStyle, string> = {
  business: "Деловой",
  emotional: "Эмоциональный",
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

export function getLetterWordRange(length: LetterLength): { min: number; max: number } {
  const target = LETTER_WORD_TARGETS[length];
  const tolerance = Math.floor(target * LETTER_WORD_TOLERANCE);

  return {
    min: target - tolerance,
    max: target + tolerance,
  };
}
