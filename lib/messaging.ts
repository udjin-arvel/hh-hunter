import { toAppError } from "./errors";
import { importPortfolioMessageSchema, importPortfolioResponseSchema } from "./schemas";
import type { AppError } from "./types";

export async function importPortfolioFromUrl(url: string): Promise<string> {
  const message = importPortfolioMessageSchema.parse({
    type: "import_portfolio",
    url,
  });

  const response = await browser.runtime.sendMessage(message);
  const parsed = importPortfolioResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw toAppError(new Error("Некорректный ответ service worker"));
  }

  if (!parsed.data.ok) {
    throw parsed.data.error;
  }

  return parsed.data.text;
}

export function getErrorMessage(error: unknown): string {
  const appError = toAppError(error);
  return (appError as AppError).message;
}
