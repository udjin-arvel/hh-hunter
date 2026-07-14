import { z } from "zod";

import { createAppError } from "../errors";
import { parseGenerationResult } from "../generation";
import type { GenerationRequest, GenerationResult, LetterLength, ResponseFormat } from "../types";

export const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
export const DEEPSEEK_MODELS_URL = "https://api.deepseek.com/v1/models";
export const DEEPSEEK_FETCH_TIMEOUT_MS = 15_000;

export const GENERATION_CANCELLED_MESSAGE = "Генерация отменена.";

export const deepSeekChatResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string(),
        }),
      }),
    )
    .min(1),
});

export type DeepSeekChatResponse = z.infer<typeof deepSeekChatResponseSchema>;

export interface GenerateLetterOptions {
  signal?: AbortSignal;
  seed?: number;
}

export function mapDeepSeekHttpStatusToError(status: number) {
  if (status === 401) {
    return createAppError("UNAUTHORIZED", "Неверный API-ключ DeepSeek.");
  }

  if (status === 429) {
    return createAppError("RATE_LIMIT", "Превышен лимит запросов к DeepSeek. Попробуйте позже.");
  }

  if (status >= 500) {
    return createAppError("NETWORK", `DeepSeek временно недоступен (код ${status}).`);
  }

  return createAppError("NETWORK", `Не удалось выполнить запрос к DeepSeek (код ${status}).`);
}

export function mapDeepSeekFetchError(error: unknown, cancelled = false) {
  if (error instanceof DOMException && error.name === "AbortError") {
    if (cancelled) {
      return createAppError("UNKNOWN", GENERATION_CANCELLED_MESSAGE);
    }

    return createAppError("TIMEOUT", "Превышено время ожидания ответа от DeepSeek.");
  }

  if (error instanceof TypeError) {
    return createAppError("NETWORK", "Не удалось подключиться к DeepSeek.", error);
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    return error as ReturnType<typeof createAppError>;
  }

  return createAppError("UNKNOWN", "Не удалось выполнить запрос к DeepSeek.", error);
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };
}

function buildFetchSignal(options?: GenerateLetterOptions): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(DEEPSEEK_FETCH_TIMEOUT_MS);

  if (!options?.signal) {
    return timeoutSignal;
  }

  return AbortSignal.any([timeoutSignal, options.signal]);
}

export async function verifyDeepSeekApiKey(apiKey: string): Promise<void> {
  let response: Response;

  try {
    response = await fetch(DEEPSEEK_MODELS_URL, {
      method: "GET",
      headers: buildAuthHeaders(apiKey),
      signal: AbortSignal.timeout(DEEPSEEK_FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    throw mapDeepSeekFetchError(error);
  }

  if (!response.ok) {
    throw mapDeepSeekHttpStatusToError(response.status);
  }
}

export async function generateLetter(
  apiKey: string,
  request: GenerationRequest,
  expectedLength: LetterLength,
  format: ResponseFormat = "letter",
  options?: GenerateLetterOptions,
): Promise<GenerationResult> {
  const signal = buildFetchSignal(options);
  let response: Response;

  try {
    response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        ...buildAuthHeaders(apiKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: request.user },
        ],
        temperature: request.temperature,
        response_format: request.response_format,
        seed: options?.seed ?? Math.floor(Math.random() * 1_000_000),
      }),
      signal,
    });
  } catch (error) {
    const wasCancelled = options?.signal?.aborted ?? false;
    throw mapDeepSeekFetchError(error, wasCancelled);
  }

  if (!response.ok) {
    throw mapDeepSeekHttpStatusToError(response.status);
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    throw createAppError("VALIDATION", "DeepSeek вернул некорректный JSON.", error);
  }

  const parsed = deepSeekChatResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw createAppError(
      "VALIDATION",
      "Ответ DeepSeek не соответствует ожидаемому формату.",
      parsed.error,
    );
  }

  const content = parsed.data.choices[0]?.message.content ?? "";
  const result = parseGenerationResult(content, expectedLength, format);

  if (!result.ok) {
    throw result.error;
  }

  return result.result;
}
