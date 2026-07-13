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
  achievements: z.string().default(""),
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

export const letterStyleSchema = z.enum(["business", "emotional", "metrics"]);

export const letterLengthSchema = z.enum(["short", "medium", "long"]);

export const generationSettingsSchema = z.object({
  style: letterStyleSchema.default("business"),
  length: letterLengthSchema.default("medium"),
  focus: z.string().default(""),
});

export const generationResultSchema = z.object({
  hidden_keys: z.array(z.string()).min(1),
  unique_intersection: z.string().min(1),
  letter: z.string().min(1),
});

export const backgroundPingMessageSchema = z.object({
  type: z.literal("ping"),
});

export const backgroundPongResponseSchema = z.object({
  type: z.literal("pong"),
  ok: z.literal(true),
});

export const importPortfolioMessageSchema = z.object({
  type: z.literal("import_portfolio"),
  url: z.string().url(),
});

export const importPortfolioSuccessSchema = z.object({
  type: z.literal("import_portfolio_result"),
  ok: z.literal(true),
  text: z.string(),
});

export const importPortfolioErrorSchema = z.object({
  type: z.literal("import_portfolio_result"),
  ok: z.literal(false),
  error: appErrorSchema,
});

export const importPortfolioResponseSchema = z.discriminatedUnion("ok", [
  importPortfolioSuccessSchema,
  importPortfolioErrorSchema,
]);

export const STORAGE_VERSION = 1;

export const tabKeySchema = z.enum(["profile", "generator", "api"]);

export const persistedStateSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  profile: profileSchema,
  settings: generationSettingsSchema,
  apiKey: z.string().default(""),
  ui: z
    .object({
      activeTab: tabKeySchema.default("generator"),
    })
    .default({ activeTab: "generator" }),
});
