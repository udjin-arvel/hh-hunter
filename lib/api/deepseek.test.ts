import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEEPSEEK_API_URL,
  DEEPSEEK_MODELS_URL,
  GENERATION_CANCELLED_MESSAGE,
  generateLetter,
  mapDeepSeekFetchError,
  mapDeepSeekHttpStatusToError,
  verifyDeepSeekApiKey,
} from "./deepseek";
import type { GenerationRequest } from "../types";

const request: GenerationRequest = {
  system: "system prompt",
  user: "user prompt",
  model: "deepseek-chat",
  temperature: 0.7,
  response_format: { type: "json_object" },
};

function buildLetter(wordCount: number): string {
  return Array.from({ length: wordCount }, (_, index) => `слово${index + 1}`).join(" ");
}

function buildValidContent() {
  return JSON.stringify({
    hidden_keys: ["ключ1", "ключ2", "ключ3"],
    unique_intersection: "Точка пересечения между опытом и вакансией достаточно длинная.",
    letter: buildLetter(100),
  });
}

describe("mapDeepSeekHttpStatusToError", () => {
  it("maps common statuses", () => {
    expect(mapDeepSeekHttpStatusToError(401).code).toBe("UNAUTHORIZED");
    expect(mapDeepSeekHttpStatusToError(429).code).toBe("RATE_LIMIT");
    expect(mapDeepSeekHttpStatusToError(500).code).toBe("NETWORK");
    expect(mapDeepSeekHttpStatusToError(404).code).toBe("NETWORK");
  });
});

describe("mapDeepSeekFetchError", () => {
  it("maps user cancellation separately from timeout", () => {
    const abortError = new DOMException("Aborted", "AbortError");

    expect(mapDeepSeekFetchError(abortError, true).message).toBe(GENERATION_CANCELLED_MESSAGE);
    expect(mapDeepSeekFetchError(abortError, false).code).toBe("TIMEOUT");
  });
});

describe("verifyDeepSeekApiKey", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }),
    );

    await expect(verifyDeepSeekApiKey("sk-test")).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(
      DEEPSEEK_MODELS_URL,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test",
        }),
      }),
    );
  });

  it("rejects on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }),
    );

    await expect(verifyDeepSeekApiKey("bad-key")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("generateLetter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns validated generation result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: buildValidContent() } }],
        }),
      }),
    );

    const result = await generateLetter("sk-test", request, "medium");

    expect(result.hidden_keys).toHaveLength(3);
    expect(result.letter).toContain("слово1");
    expect(fetch).toHaveBeenCalledWith(
      DEEPSEEK_API_URL,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test",
        }),
      }),
    );
  });

  it("rejects invalid JSON content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "not json" } }],
        }),
      }),
    );

    await expect(generateLetter("sk-test", request, "medium")).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("rejects 401 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }),
    );

    await expect(generateLetter("sk-test", request, "medium")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects aborted signal as cancellation", async () => {
    const abortController = new AbortController();
    abortController.abort();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url, init?: RequestInit) => {
        const signal = init?.signal;

        if (signal?.aborted) {
          return Promise.reject(new DOMException("Aborted", "AbortError"));
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: buildValidContent() } }],
          }),
        });
      }),
    );

    await expect(
      generateLetter("sk-test", request, "medium", "letter", {
        signal: abortController.signal,
      }),
    ).rejects.toMatchObject({
      message: GENERATION_CANCELLED_MESSAGE,
    });
  });
});
