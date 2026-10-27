import type { Vacancy } from "./types";

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

export function sanitizeFilenamePart(text: string, maxLength = 80): string {
  const normalized = text.trim().replace(INVALID_FILENAME_CHARS, "").replace(/\s+/g, "_");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength);
}

export function buildVacancyMarkdownFilename(vacancy: Vacancy): string {
  const titlePart = sanitizeFilenamePart(vacancy.title);
  const base = titlePart ? `${vacancy.id}_${titlePart}` : vacancy.id;
  return `${base}.md`;
}

export function formatVacancyAsMarkdown(vacancy: Vacancy): string {
  const lines: string[] = [`# ${vacancy.title}`, ""];

  lines.push(`- **Компания:** ${vacancy.company_name}`);

  if (vacancy.company_type) {
    lines.push(`- **Тип компании:** ${vacancy.company_type}`);
  }

  if (vacancy.experience_required) {
    lines.push(`- **Опыт:** ${vacancy.experience_required}`);
  }

  if (vacancy.employment) {
    lines.push(`- **Занятость:** ${vacancy.employment}`);
  }

  if (vacancy.url) {
    lines.push(`- **Ссылка:** ${vacancy.url}`);
  }

  if (vacancy.key_skills.length > 0) {
    lines.push(`- **Навыки:** ${vacancy.key_skills.join(", ")}`);
  }

  lines.push("");

  if (vacancy.description) {
    lines.push("## Описание", "", vacancy.description, "");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = "text/markdown;charset=utf-8",
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadVacancyMarkdown(vacancy: Vacancy): void {
  downloadTextFile(buildVacancyMarkdownFilename(vacancy), formatVacancyAsMarkdown(vacancy));
}
