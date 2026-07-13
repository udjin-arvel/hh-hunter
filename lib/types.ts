import type { z } from "zod";

import type {
  appErrorCodeSchema,
  appErrorSchema,
  backgroundPingMessageSchema,
  backgroundPongResponseSchema,
  generationResultSchema,
  generationSettingsSchema,
  letterLengthSchema,
  letterStyleSchema,
  profileSchema,
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
export type BackgroundPingMessage = z.infer<typeof backgroundPingMessageSchema>;
export type BackgroundPongResponse = z.infer<typeof backgroundPongResponseSchema>;

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  style: "business",
  length: "medium",
  focus: "",
};

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
