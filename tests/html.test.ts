/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";

import { htmlToMarkdown, isInformativeText, normalizeWhitespace, stripHtmlToText } from "@/lib/html";

describe("stripHtmlToText", () => {
  it("removes scripts, styles and tags", () => {
    const html = `
      <html>
        <head><style>body { color: red; }</style></head>
        <body>
          <script>alert("x")</script>
          <h1>Hello</h1>
          <p>Portfolio &amp; projects</p>
        </body>
      </html>
    `;

    expect(stripHtmlToText(html)).toBe("Hello Portfolio & projects");
  });
});

describe("normalizeWhitespace", () => {
  it("collapses whitespace", () => {
    expect(normalizeWhitespace("  one   two \n three ")).toBe("one two three");
  });
});

describe("htmlToMarkdown", () => {
  it("converts paragraphs, emphasis and lists", () => {
    const markdown = htmlToMarkdown(
      "<p>Опыт с <strong>Figma</strong>.</p><p>Второй блок.</p><ul><li>UX</li><li>UI</li></ul>",
    );

    expect(markdown).toBe("Опыт с **Figma**.\n\nВторой блок.\n\n- UX\n- UI");
  });
});

describe("isInformativeText", () => {
  it("requires minimum length", () => {
    expect(isInformativeText("short")).toBe(false);
    expect(isInformativeText("a".repeat(100))).toBe(true);
  });
});
