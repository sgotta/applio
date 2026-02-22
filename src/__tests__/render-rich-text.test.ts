import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { renderRichText, renderRichDocument } from "@/lib/render-rich-text";

function toHtml(node: React.ReactNode): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return node;
  return renderToStaticMarkup(createElement("span", null, node));
}

describe("renderRichText", () => {
  it("returns null for empty string", () => {
    expect(renderRichText("")).toBeNull();
  });

  it("returns plain text as-is", () => {
    expect(renderRichText("Hello world")).toBe("Hello world");
  });

  it("renders bold text", () => {
    const html = toHtml(renderRichText("<strong>bold</strong>"));
    expect(html).toContain("<strong>bold</strong>");
  });

  it("renders italic text", () => {
    const html = toHtml(renderRichText("<em>italic</em>"));
    expect(html).toContain("<em>italic</em>");
  });

  it("renders underline text", () => {
    const html = toHtml(renderRichText("<u>underline</u>"));
    expect(html).toContain("<u>underline</u>");
  });

  it("renders strikethrough text", () => {
    const html = toHtml(renderRichText("<s>struck</s>"));
    expect(html).toContain("<s>struck</s>");
  });

  it("renders inline color spans", () => {
    const html = toHtml(
      renderRichText('<span style="color: red">colored</span>')
    );
    expect(html).toContain("color:red");
    expect(html).toContain("colored");
  });

  it("renders highlight marks", () => {
    const html = toHtml(
      renderRichText(
        '<mark style="background-color: yellow" data-color="yellow">highlighted</mark>'
      )
    );
    expect(html).toContain("background-color:yellow");
    expect(html).toContain("highlighted");
  });

  it("strips outer <p> wrapper", () => {
    const html = toHtml(renderRichText("<p>content</p>"));
    expect(html).toContain("content");
  });

  it("handles <br> tags", () => {
    const html = toHtml(renderRichText("line1<br>line2"));
    expect(html).toContain("<br");
    expect(html).toContain("line1");
    expect(html).toContain("line2");
  });

  it("decodes HTML entities within tags", () => {
    const html = toHtml(renderRichText("<strong>&amp; &lt; &gt;</strong>"));
    expect(html).toContain("&amp; &lt; &gt;"); // entities re-escaped by renderToStaticMarkup
  });

  it("returns entity-only text as-is when no HTML tags (fast path)", () => {
    // Fast path: no "<" in input → returned as-is without decoding
    expect(renderRichText("&amp; &lt; &gt;")).toBe("&amp; &lt; &gt;");
  });

  it("handles nested formatting", () => {
    const html = toHtml(
      renderRichText("<strong><em>bold italic</em></strong>")
    );
    expect(html).toContain("<strong><em>bold italic</em></strong>");
  });
});

describe("renderRichDocument", () => {
  it("returns null for empty string", () => {
    expect(renderRichDocument("")).toBeNull();
  });

  it("renders unordered list", () => {
    const html = toHtml(
      renderRichDocument(
        "<ul><li><p>Item 1</p></li><li><p>Item 2</p></li></ul>"
      )
    );
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(html).toContain("Item 1");
    expect(html).toContain("Item 2");
  });

  it("renders ordered list", () => {
    const html = toHtml(
      renderRichDocument("<ol><li><p>First</p></li></ol>")
    );
    expect(html).toContain("<ol");
    expect(html).toContain("First");
  });

  it("renders headings", () => {
    const html = toHtml(renderRichDocument("<h2>Title</h2><h3>Sub</h3>"));
    expect(html).toContain("<h2");
    expect(html).toContain("Title");
    expect(html).toContain("<h3");
    expect(html).toContain("Sub");
  });

  it("renders paragraphs", () => {
    const html = toHtml(renderRichDocument("<p>A paragraph</p>"));
    expect(html).toContain("<p");
    expect(html).toContain("A paragraph");
  });

  it("renders blockquote", () => {
    const html = toHtml(
      renderRichDocument("<blockquote><p>Quote</p></blockquote>")
    );
    expect(html).toContain("<blockquote");
    expect(html).toContain("Quote");
  });

  it("renders inline formatting within blocks", () => {
    const html = toHtml(
      renderRichDocument("<p><strong>Bold</strong> text</p>")
    );
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain(" text");
  });

  it("returns plain text as-is when no HTML tags", () => {
    expect(renderRichDocument("Just text")).toBe("Just text");
  });
});
