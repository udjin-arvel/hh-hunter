import { afterEach, describe, expect, it, vi } from "vitest";

import {
  compressProfileText,
  DEEPSEEK_API_URL,
  DEEPSEEK_MODELS_URL,
  GENERATION_CANCELLED_MESSAGE,
  generateLetter,
  mapDeepSeekFetchError,
  mapDeepSeekHttpStatusToError,
  verifyDeepSeekApiKey,
} from "@/lib/api/deepseek";
import type { GenerationRequest, Vacancy } from "@/lib/types";

const request: GenerationRequest = {
  system: "system prompt",
  user: "user prompt",
  model: "deepseek-chat",
  temperature: 0.4,
  response_format: { type: "json_object" },
};

const vacancy: Vacancy = {
  id: "1",
  title: "Python-разработчик",
  company_name: "Test",
  company_type: "",
  description: "RAG, LangGraph, FastAPI",
  description_html: "",
  key_skills: ["Python", "RAG"],
  experience_required: "",
  employment: "",
};

function buildValidContent() {
  return JSON.stringify({
    hidden_keys: ["ключ1", "ключ2", "ключ3"],
    unique_intersection: "Точка пересечения между опытом и вакансией достаточно длинная.",
    edit_spec: {
      role: "Python-разработчик",
      familiar_with: ["RAG", "LangGraph", "FastAPI"],
      relevant_work: ["Делал RAG-пайплайн для SEO-описаний."],
    },
    theses: ["Тезис один.", "Тезис два.", "Тезис три.", "Тезис четыре."],
    letter:
      "Здравствуйте, заинтересовался вашей вакансией. Хорошо знаком с RAG и Python: делал RAG-пайплайн. Если мой опыт вам интересен, можем продолжить общение.",
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

    const result = await generateLetter("sk-test", request, "medium", { vacancy });

    expect(result.hidden_keys).toHaveLength(3);
    expect(result.letter).toContain("RAG");
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

    await expect(generateLetter("sk-test", request, "medium", { vacancy })).rejects.toMatchObject({
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

    await expect(generateLetter("sk-test", request, "medium", { vacancy })).rejects.toMatchObject({
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
      generateLetter("sk-test", request, "medium", {
        signal: abortController.signal,
        vacancy,
      }),
    ).rejects.toMatchObject({
      message: GENERATION_CANCELLED_MESSAGE,
    });
  });
});

describe("compressProfileText", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns trimmed plain text from DeepSeek", async () => {
    const compressed = "а".repeat(120);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: `  ${compressed}  ` } }],
        }),
      }),
    );

    const result = await compressProfileText("sk-test", "б".repeat(150));

    expect(result).toBe(compressed);
    expect(fetch).toHaveBeenCalledWith(
      DEEPSEEK_API_URL,
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"temperature":0.4'),
      }),
    );
  });

  it("rejects short input before calling API", async () => {
    vi.stubGlobal("fetch", vi.fn());

    await expect(compressProfileText("sk-test", "коротко")).rejects.toMatchObject({
      code: "VALIDATION",
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});
