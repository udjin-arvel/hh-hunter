import { z } from "zod";

import type { Profile } from "./types";

const portfolioUrlSchema = z
  .string()
  .url("Укажите корректную ссылку (http:// или https://)")
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "Поддерживаются только ссылки http:// и https://");

export function validatePortfolioUrl(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const result = portfolioUrlSchema.safeParse(trimmed);
  return result.success ? null : (result.error.issues[0]?.message ?? "Некорректная ссылка");
}

export function getProfilePreviewText(profile: Profile): string {
  const source = profile.portfolioText.trim() || profile.achievements.trim();
  return source;
}

export function truncatePreview(text: string, limit = 200): string {
  const normalized = text.trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit)}…`;
}
