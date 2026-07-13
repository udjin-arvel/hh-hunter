import { afterEach, describe, expect, it, vi } from "vitest";

import { getDeepSeekApiKey } from "./deepseek-config";

describe("getDeepSeekApiKey", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns trimmed API key from env", () => {
    vi.stubEnv("WXT_DEEPSEEK_API_KEY", "  sk-test  ");

    expect(getDeepSeekApiKey()).toBe("sk-test");
  });

  it("throws when env is missing", () => {
    vi.stubEnv("WXT_DEEPSEEK_API_KEY", "");

    expect(() => getDeepSeekApiKey()).toThrow(/WXT_DEEPSEEK_API_KEY/);
  });
});
