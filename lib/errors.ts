import { appErrorSchema } from "./schemas";
import type { AppError, AppErrorCode } from "./types";

export function createAppError(code: AppErrorCode, message: string, cause?: unknown): AppError {
  return appErrorSchema.parse({ code, message, cause });
}

export function isAppError(value: unknown): value is AppError {
  return appErrorSchema.safeParse(value).success;
}

export function toAppError(error: unknown, fallbackMessage = "Неизвестная ошибка"): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return createAppError("UNKNOWN", error.message, error);
  }

  return createAppError("UNKNOWN", fallbackMessage, error);
}
