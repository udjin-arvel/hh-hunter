import { afterEach, describe, expect, it, vi } from "vitest";

import { getHhApiHeaders, getHhApiUserAgent, getHhBrowserHeaders } from "./hh-config";

describe("getHhApiUserAgent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses env override when provided", () => {
    vi.stubEnv("WXT_HH_USER_AGENT", "CustomApp/2.0 (me@mail.ru)");

    expect(getHhApiUserAgent()).toBe("CustomApp/2.0 (me@mail.ru)");
  });

  it("falls back to default user agent", () => {
    vi.stubEnv("WXT_HH_USER_AGENT", "");

    expect(getHhApiUserAgent()).toBe("HH-Hunter/1.1.0 (chrome-extension)");
  });
});

describe("getHhApiHeaders", () => {
  it("includes required HH API headers", () => {
    const headers = getHhApiHeaders() as Record<string, string>;

    expect(headers.Accept).toBe("application/json");
    expect(headers["User-Agent"]).toContain("HH-Hunter/");
    expect(headers["Accept-Language"]).toBe("ru-RU");
  });
});

describe("getHhBrowserHeaders", () => {
  it("includes browser-like headers for hh.ru HTML", () => {
    const headers = getHhBrowserHeaders() as Record<string, string>;

    expect(headers.Accept).toContain("text/html");
    expect(headers["User-Agent"]).toContain("Chrome/");
    expect(headers["Accept-Language"]).toContain("ru");
  });
});
