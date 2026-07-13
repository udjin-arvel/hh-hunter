const HTML_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

export function decodeBasicHtmlEntities(text: string): string {
  return text.replace(
    /&(?:nbsp|amp|lt|gt|quot|#39);/g,
    (entity) => HTML_ENTITY_MAP[entity] ?? entity,
  );
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function stripHtmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");

  const withoutTags = withoutScripts.replace(/<[^>]+>/g, " ");
  return normalizeWhitespace(decodeBasicHtmlEntities(withoutTags));
}

export function isInformativeText(text: string, minChars = 100): boolean {
  return normalizeWhitespace(text).length >= minChars;
}
