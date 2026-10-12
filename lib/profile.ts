import type { Profile } from "./types";

export function getProfilePreviewText(profile: Profile): string {
  return profile.portfolioText.trim();
}

export function truncatePreview(text: string, limit = 200): string {
  const normalized = text.trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit)}…`;
}
