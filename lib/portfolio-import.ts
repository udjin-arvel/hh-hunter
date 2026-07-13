import { createAppError } from "./errors";
import { isInformativeText, stripHtmlToText } from "./html";
import type { AppError } from "./types";

export const FETCH_TIMEOUT_MS = 15_000;
export const MAX_RESPONSE_BYTES = 5_000_000;
export const MAX_EXTRACTED_CHARS = 20_000;
export const MIN_INFORMATIVE_CHARS = 100;

const ACCEPTED_CONTENT_TYPES = ["text/html", "text/plain", "application/xhtml+xml"];

export function processPortfolioHtml(
  html: string,
): { ok: true; text: string } | { ok: false; error: AppError } {
  const text = stripHtmlToText(html).slice(0, MAX_EXTRACTED_CHARS);

  if (!isInformativeText(text, MIN_INFORMATIVE_CHARS)) {
    return {
      ok: false,
      error: createAppError(
        "VALIDATION",
        "Не удалось извлечь достаточно текста со страницы. Вставьте опыт вручную.",
      ),
    };
  }

  return { ok: true, text };
}

export function isAcceptedContentType(contentType: string | null): boolean {
  if (!contentType) {
    return true;
  }

  const normalized = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return ACCEPTED_CONTENT_TYPES.some((type) => normalized.includes(type));
}

export function mapHttpStatusToError(status: number): AppError {
  if (status === 404) {
    return createAppError("NOT_FOUND", "Страница не найдена (404).");
  }

  if (status === 401 || status === 403) {
    return createAppError(
      "UNAUTHORIZED",
      "Страница недоступна без авторизации. Вставьте опыт вручную.",
    );
  }

  if (status === 429) {
    return createAppError("RATE_LIMIT", "Слишком много запросов к сайту. Попробуйте позже.");
  }

  if (status >= 500) {
    return createAppError("NETWORK", `Сервер вернул ошибку ${status}.`);
  }

  return createAppError("NETWORK", `Не удалось загрузить страницу (код ${status}).`);
}

export function mapFetchError(error: unknown): AppError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return createAppError("TIMEOUT", "Превышено время ожидания ответа от сайта.");
  }

  if (error instanceof TypeError) {
    return createAppError(
      "NETWORK",
      "Не удалось загрузить страницу. Вставьте опыт вручную в поле достижений.",
      error,
    );
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    return error as AppError;
  }

  return createAppError("UNKNOWN", "Не удалось импортировать портфолио.", error);
}

export async function readResponseWithLimit(response: Response, maxBytes: number): Promise<string> {
  const contentLength = Number(response.headers.get("content-length") ?? 0);

  if (contentLength > maxBytes) {
    throw createAppError("VALIDATION", "Страница слишком большая для импорта.");
  }

  const body = await response.text();

  if (body.length > maxBytes) {
    throw createAppError("VALIDATION", "Страница слишком большая для импорта.");
  }

  return body;
}

export function getOriginPattern(url: string): string {
  const parsed = new URL(url);
  return `${parsed.origin}/*`;
}

export async function ensureOriginPermission(url: string): Promise<void> {
  const originPattern = getOriginPattern(url);
  const hasPermission = await browser.permissions.contains({ origins: [originPattern] });

  if (hasPermission) {
    return;
  }

  const granted = await browser.permissions.request({ origins: [originPattern] });

  if (!granted) {
    throw createAppError(
      "UNAUTHORIZED",
      "Нет доступа к сайту портфолио. Разрешите доступ или вставьте опыт вручную.",
    );
  }
}

async function assertOriginPermission(url: string): Promise<void> {
  const originPattern = getOriginPattern(url);
  const hasPermission = await browser.permissions.contains({ origins: [originPattern] });

  if (!hasPermission) {
    throw createAppError(
      "UNAUTHORIZED",
      "Нет доступа к сайту портфолио. Разрешите доступ или вставьте опыт вручную.",
    );
  }
}

export async function fetchPortfolioPage(url: string): Promise<string> {
  await assertOriginPermission(url);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    throw mapFetchError(error);
  }

  if (!response.ok) {
    throw mapHttpStatusToError(response.status);
  }

  if (!isAcceptedContentType(response.headers.get("content-type"))) {
    throw createAppError("VALIDATION", "Страница имеет неподдерживаемый формат контента.");
  }

  const html = await readResponseWithLimit(response, MAX_RESPONSE_BYTES);
  const processed = processPortfolioHtml(html);

  if (!processed.ok) {
    throw processed.error;
  }

  return processed.text;
}
