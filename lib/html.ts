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

function normalizeMarkdownWhitespace(markdown: string): string {
  return markdown
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function convertListElement(list: Element, ordered: boolean): string {
  const items = [...list.children].filter((child) => child.tagName.toLowerCase() === "li");

  const lines = items.map((item, index) => {
    const marker = ordered ? `${index + 1}. ` : "- ";
    const text = convertNodeChildren(item).trim().replace(/\n+/g, " ");
    return `${marker}${text}`;
  });

  return `${lines.join("\n")}\n\n`;
}

function convertNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return decodeBasicHtmlEntities(node.textContent ?? "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const inner = () => convertNodeChildren(element);

  switch (tag) {
    case "p":
    case "div":
      return `${inner().trim()}\n\n`;
    case "br":
      return "\n";
    case "h1":
      return `# ${inner().trim()}\n\n`;
    case "h2":
      return `## ${inner().trim()}\n\n`;
    case "h3":
      return `### ${inner().trim()}\n\n`;
    case "h4":
    case "h5":
    case "h6":
      return `#### ${inner().trim()}\n\n`;
    case "ul":
      return convertListElement(element, false);
    case "ol":
      return convertListElement(element, true);
    case "strong":
    case "b":
      return `**${inner()}**`;
    case "em":
    case "i":
      return `*${inner()}*`;
    case "a": {
      const href = element.getAttribute("href") ?? "";
      const text = inner().trim();

      if (href && text) {
        return `[${text}](${href})`;
      }

      return text;
    }
    case "script":
    case "style":
      return "";
    default:
      return inner();
  }
}

function convertNodeChildren(parent: Element): string {
  return [...parent.childNodes].map((child) => convertNode(child)).join("");
}

export function stripHtmlToFormattedText(html: string): string {
  const withBreaks = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ");

  const withoutTags = withBreaks.replace(/<[^>]+>/g, "");

  return normalizeMarkdownWhitespace(
    decodeBasicHtmlEntities(withoutTags)
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .join("\n"),
  );
}

export function htmlToMarkdown(html: string): string {
  const trimmed = html.trim();

  if (!trimmed) {
    return "";
  }

  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  if (typeof DOMParser === "undefined") {
    return stripHtmlToFormattedText(trimmed);
  }

  const document = new DOMParser().parseFromString(trimmed, "text/html");
  return normalizeMarkdownWhitespace(convertNodeChildren(document.body));
}

export function isInformativeText(text: string, minChars = 100): boolean {
  return normalizeWhitespace(text).length >= minChars;
}
