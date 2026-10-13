import { z } from "zod";

export const appErrorCodeSchema = z.enum([
  "NETWORK",
  "NOT_FOUND",
  "RATE_LIMIT",
  "UNAUTHORIZED",
  "VALIDATION",
  "TIMEOUT",
  "UNKNOWN",
]);

export const appErrorSchema = z.object({
  code: appErrorCodeSchema,
  message: z.string().min(1),
  cause: z.unknown().optional(),
});

export const profileSchema = z.object({
  name: z.string().default(""),
  portfolioLink: z.string().default(""),
  portfolioText: z.string().default(""),
  technologiesToStudy: z.array(z.string().min(1)).default([]),
});

export const vacancySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  company_name: z.string().min(1),
  company_type: z.string().default(""),
  description: z.string().default(""),
  key_skills: z.array(z.string()).default([]),
  experience_required: z.string().default(""),
  employment: z.string().default(""),
  url: z.string().url().optional(),
});

export const letterLengthSchema = z.enum(["short", "medium", "long"]);

export const fantasyLevelSchema = z.enum(["low", "medium", "high"]);

export const letterExampleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  letter: z.string().min(1),
  favorite: z.boolean().default(false),
});

export const generationSettingsSchema = z.object({
  length: letterLengthSchema.default("medium"),
  focus: z.string().default(""),
  fantasy: fantasyLevelSchema.default("medium"),
  exampleIds: z.array(z.string()).default([]),
  includeTheses: z.boolean().default(true),
  includeHiddenKeys: z.boolean().default(true),
  includeTechnologies: z.boolean().default(true),
});

export const generationResultSchema = z.object({
  hidden_keys: z.array(z.string().min(1)).default([]),
  technologies: z.array(z.string().min(1)).default([]),
  unique_intersection: z.string().min(20),
  letter: z.string().min(1),
  theses: z.array(z.string().min(1)).default([]),
});

export const generationRequestSchema = z.object({
  system: z.string().min(1),
  user: z.string().min(1),
  model: z.literal("deepseek-chat"),
  temperature: z.literal(0.7),
  response_format: z.object({
    type: z.literal("json_object"),
  }),
});

export const backgroundPingMessageSchema = z.object({
  type: z.literal("ping"),
});

export const backgroundPongResponseSchema = z.object({
  type: z.literal("pong"),
  ok: z.literal(true),
});

export const compressProfileMessageSchema = z.object({
  type: z.literal("compress_profile"),
  rawText: z.string().min(1),
});

export const compressProfileSuccessSchema = z.object({
  type: z.literal("compress_profile_result"),
  ok: z.literal(true),
  text: z.string().min(1),
});

export const compressProfileErrorSchema = z.object({
  type: z.literal("compress_profile_result"),
  ok: z.literal(false),
  error: appErrorSchema,
});

export const compressProfileResponseSchema = z.discriminatedUnion("ok", [
  compressProfileSuccessSchema,
  compressProfileErrorSchema,
]);

export const fetchVacancyMessageSchema = z.object({
  type: z.literal("fetch_vacancy"),
  vacancyId: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  tabId: z.number().int().positive().optional(),
});

export const fetchVacancySuccessSchema = z.object({
  type: z.literal("fetch_vacancy_result"),
  ok: z.literal(true),
  vacancy: vacancySchema,
});

export const fetchVacancyErrorSchema = z.object({
  type: z.literal("fetch_vacancy_result"),
  ok: z.literal(false),
  error: appErrorSchema,
});

export const fetchVacancyResponseSchema = z.discriminatedUnion("ok", [
  fetchVacancySuccessSchema,
  fetchVacancyErrorSchema,
]);

export const generateLetterMessageSchema = z.object({
  type: z.literal("generate_letter"),
  profile: profileSchema,
  vacancy: vacancySchema,
  settings: generationSettingsSchema,
  examples: z.array(letterExampleSchema).default([]),
});

export const generateLetterSuccessSchema = z.object({
  type: z.literal("generate_letter_result"),
  ok: z.literal(true),
  result: generationResultSchema,
});

export const generateLetterErrorSchema = z.object({
  type: z.literal("generate_letter_result"),
  ok: z.literal(false),
  error: appErrorSchema,
});

export const generateLetterResponseSchema = z.discriminatedUnion("ok", [
  generateLetterSuccessSchema,
  generateLetterErrorSchema,
]);

export const cancelGenerateLetterMessageSchema = z.object({
  type: z.literal("cancel_generate_letter"),
});

export const cancelGenerateLetterResponseSchema = z.object({
  type: z.literal("cancel_generate_letter_result"),
  ok: z.literal(true),
});

export const STORAGE_VERSION = 3;

export const tabKeySchema = z.enum(["profile", "generator", "examples"]);

export const persistedStateSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  profile: profileSchema,
  settings: generationSettingsSchema,
  examples: z.array(letterExampleSchema).default([]),
  ui: z
    .object({
      activeTab: tabKeySchema.default("generator"),
    })
    .default({ activeTab: "generator" }),
});
