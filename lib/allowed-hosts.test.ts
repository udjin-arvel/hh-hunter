import { describe, expect, it } from "vitest";

import {
  DEEPSEEK_API_HOST_PATTERN,
  HH_API_HOST_PATTERN,
  OPTIONAL_HOST_PERMISSIONS,
  REQUIRED_HOST_PERMISSIONS,
  isAllowedRequiredFetchUrl,
  isHttpOrHttpsUrl,
} from "./allowed-hosts";

describe("allowed host constants", () => {
  it("lists required host permissions for HH and DeepSeek", () => {
    expect(REQUIRED_HOST_PERMISSIONS).toEqual([
      "https://api.hh.ru/*",
      "https://api.deepseek.com/*",
      "https://hh.ru/*",
      "https://*.hh.ru/*",
    ]);
  });

  it("lists optional host permissions for portfolio import", () => {
    expect(OPTIONAL_HOST_PERMISSIONS).toEqual(["https://*/*", "http://*/*"]);
  });

  it("matches HH API URLs", () => {
    expect(HH_API_HOST_PATTERN.test("https://api.hh.ru/vacancies/123")).toBe(true);
    expect(HH_API_HOST_PATTERN.test("https://example.com/")).toBe(false);
  });

  it("matches DeepSeek API URLs", () => {
    expect(DEEPSEEK_API_HOST_PATTERN.test("https://api.deepseek.com/v1/chat/completions")).toBe(
      true,
    );
    expect(DEEPSEEK_API_HOST_PATTERN.test("https://api.deepseek.com/")).toBe(true);
  });
});

describe("isAllowedRequiredFetchUrl", () => {
  it("allows only HH and DeepSeek API hosts", () => {
    expect(isAllowedRequiredFetchUrl("https://api.hh.ru/vacancies/1")).toBe(true);
    expect(isAllowedRequiredFetchUrl("https://api.deepseek.com/v1/models")).toBe(true);
    expect(isAllowedRequiredFetchUrl("https://github.com/user/portfolio")).toBe(false);
    expect(isAllowedRequiredFetchUrl("http://api.hh.ru/vacancies/1")).toBe(false);
  });
});

describe("isHttpOrHttpsUrl", () => {
  it("accepts http and https portfolio URLs", () => {
    expect(isHttpOrHttpsUrl("https://example.com/portfolio")).toBe(true);
    expect(isHttpOrHttpsUrl("http://localhost:3000")).toBe(true);
  });

  it("rejects non-http schemes and invalid URLs", () => {
    expect(isHttpOrHttpsUrl("ftp://example.com")).toBe(false);
    expect(isHttpOrHttpsUrl("not-a-url")).toBe(false);
    expect(isHttpOrHttpsUrl("")).toBe(false);
  });
});
