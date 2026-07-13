import { describe, expect, it } from "vitest";

import {
  MAX_EXTRACTED_CHARS,
  MIN_INFORMATIVE_CHARS,
  isAcceptedContentType,
  mapHttpStatusToError,
  processPortfolioHtml,
} from "./portfolio-import";

describe("processPortfolioHtml", () => {
  it("extracts informative text from html", () => {
    const html = `<html><body><p>${"Experience ".repeat(20)}</p></body></html>`;
    const result = processPortfolioHtml(html);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text.length).toBeGreaterThanOrEqual(MIN_INFORMATIVE_CHARS);
      expect(result.text.length).toBeLessThanOrEqual(MAX_EXTRACTED_CHARS);
    }
  });

  it("rejects non-informative html", () => {
    const result = processPortfolioHtml("<html><body>Hi</body></html>");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION");
    }
  });
});

describe("isAcceptedContentType", () => {
  it("accepts html and plain text", () => {
    expect(isAcceptedContentType("text/html; charset=utf-8")).toBe(true);
    expect(isAcceptedContentType("text/plain")).toBe(true);
  });

  it("rejects unsupported types", () => {
    expect(isAcceptedContentType("application/json")).toBe(false);
  });
});

describe("mapHttpStatusToError", () => {
  it("maps common statuses", () => {
    expect(mapHttpStatusToError(404).code).toBe("NOT_FOUND");
    expect(mapHttpStatusToError(401).code).toBe("UNAUTHORIZED");
    expect(mapHttpStatusToError(429).code).toBe("RATE_LIMIT");
    expect(mapHttpStatusToError(503).code).toBe("NETWORK");
  });
});
