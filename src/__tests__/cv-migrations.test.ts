import { describe, it, expect } from "vitest";
import {
  moveItem,
  migrateSidebarOrder,
  migrateMarkdownBold,
  migrateBulletsToHtml,
  migrateCVData,
} from "@/lib/cv-migrations";

describe("moveItem", () => {
  it("swaps element up", () => {
    expect(moveItem(["a", "b", "c"], 1, "up")).toEqual(["b", "a", "c"]);
  });

  it("swaps element down", () => {
    expect(moveItem(["a", "b", "c"], 1, "down")).toEqual(["a", "c", "b"]);
  });

  it("returns copy when moving first element up (no-op)", () => {
    const arr = ["a", "b"];
    const result = moveItem(arr, 0, "up");
    expect(result).toEqual(["a", "b"]);
    expect(result).not.toBe(arr); // new array
  });

  it("returns copy when moving last element down (no-op)", () => {
    expect(moveItem(["a", "b"], 1, "down")).toEqual(["a", "b"]);
  });

  it("handles single-element array", () => {
    expect(moveItem(["x"], 0, "up")).toEqual(["x"]);
    expect(moveItem(["x"], 0, "down")).toEqual(["x"]);
  });
});

describe("migrateSidebarOrder", () => {
  it("returns default order for non-array input", () => {
    expect(migrateSidebarOrder(null)).toEqual(["contact", "summary", "skills"]);
    expect(migrateSidebarOrder(undefined)).toEqual(["contact", "summary", "skills"]);
    expect(migrateSidebarOrder("foo")).toEqual(["contact", "summary", "skills"]);
  });

  it("returns valid array as-is if complete", () => {
    const order = ["skills", "contact", "summary"];
    expect(migrateSidebarOrder(order)).toEqual(["skills", "contact", "summary"]);
  });

  it("appends missing sections at the end", () => {
    expect(migrateSidebarOrder(["contact"])).toEqual(["contact", "summary", "skills"]);
  });

  it("strips invalid IDs", () => {
    expect(migrateSidebarOrder(["contact", "invalid", "skills"])).toEqual([
      "contact",
      "skills",
      "summary",
    ]);
  });
});

describe("migrateMarkdownBold", () => {
  it("converts **text** to <strong>text</strong>", () => {
    expect(migrateMarkdownBold("Hello **world**")).toBe(
      "Hello <strong>world</strong>"
    );
  });

  it("handles multiple bold segments", () => {
    expect(migrateMarkdownBold("**a** and **b**")).toBe(
      "<strong>a</strong> and <strong>b</strong>"
    );
  });

  it("returns plain text unchanged", () => {
    expect(migrateMarkdownBold("no bold here")).toBe("no bold here");
  });

  it("returns empty/falsy values unchanged", () => {
    expect(migrateMarkdownBold("")).toBe("");
  });
});

describe("migrateBulletsToHtml", () => {
  it("converts bullet items to <ul>", () => {
    const bullets = [
      { text: "Item 1", type: "bullet" },
      { text: "Item 2", type: "bullet" },
    ];
    expect(migrateBulletsToHtml(bullets)).toBe(
      "<ul><li><p>Item 1</p></li><li><p>Item 2</p></li></ul>"
    );
  });

  it("converts numbered items to <ol>", () => {
    const bullets = [{ text: "First", type: "numbered" }];
    expect(migrateBulletsToHtml(bullets)).toBe(
      "<ol><li><p>First</p></li></ol>"
    );
  });

  it("converts paragraph type to <p>", () => {
    const bullets = [{ text: "A paragraph", type: "paragraph" }];
    expect(migrateBulletsToHtml(bullets)).toBe("<p>A paragraph</p>");
  });

  it("converts heading types correctly", () => {
    expect(
      migrateBulletsToHtml([{ text: "Title", type: "title" }])
    ).toBe("<h2>Title</h2>");
    expect(
      migrateBulletsToHtml([{ text: "Sub", type: "subtitle" }])
    ).toBe("<h3>Sub</h3>");
    expect(
      migrateBulletsToHtml([{ text: "H3", type: "heading3" }])
    ).toBe("<h4>H3</h4>");
  });

  it("converts quote type to <blockquote>", () => {
    expect(
      migrateBulletsToHtml([{ text: "Quote", type: "quote" }])
    ).toBe("<blockquote><p>Quote</p></blockquote>");
  });

  it("normalizes old type names", () => {
    // subheading → title, comment → bullet, code → paragraph
    expect(
      migrateBulletsToHtml([{ text: "Subheading", type: "subheading" }])
    ).toBe("<h2>Subheading</h2>");
    expect(
      migrateBulletsToHtml([{ text: "Comment", type: "comment" }])
    ).toBe("<ul><li><p>Comment</p></li></ul>");
    expect(
      migrateBulletsToHtml([{ text: "Code", type: "code" }])
    ).toBe("<p>Code</p>");
  });

  it("handles plain string arrays as bullet items", () => {
    expect(migrateBulletsToHtml(["a", "b"])).toBe(
      "<ul><li><p>a</p></li><li><p>b</p></li></ul>"
    );
  });

  it("returns empty string for non-array input", () => {
    expect(migrateBulletsToHtml(null as unknown as [])).toBe("");
  });

  it("passes through if input is already a string", () => {
    expect(migrateBulletsToHtml("<p>already html</p>" as unknown as [])).toBe(
      "<p>already html</p>"
    );
  });

  it("groups consecutive same-type items together", () => {
    const bullets = [
      { text: "Bullet 1", type: "bullet" },
      { text: "Bullet 2", type: "bullet" },
      { text: "Paragraph", type: "paragraph" },
      { text: "Bullet 3", type: "bullet" },
    ];
    expect(migrateBulletsToHtml(bullets)).toBe(
      "<ul><li><p>Bullet 1</p></li><li><p>Bullet 2</p></li></ul>" +
        "<p>Paragraph</p>" +
        "<ul><li><p>Bullet 3</p></li></ul>"
    );
  });
});

describe("migrateCVData", () => {
  it("migrates old contacts array format", () => {
    const oldData = {
      personalInfo: {
        fullName: "Test User",
        title: "Dev",
        contacts: [
          { type: "email", value: "test@example.com" },
          { type: "phone", value: "+1234" },
          { type: "location", value: "NYC" },
        ],
      },
      summary: "A **bold** summary",
      experience: [],
      education: [],
      skills: [],
    };

    const result = migrateCVData(oldData);
    expect(result.personalInfo.email).toBe("test@example.com");
    expect(result.personalInfo.phone).toBe("+1234");
    expect(result.personalInfo.location).toBe("NYC");
    expect(result.summary).toBe("A <strong>bold</strong> summary");
  });

  it("handles new format data pass-through", () => {
    const newData = {
      personalInfo: {
        fullName: "John",
        title: "Dev",
        email: "john@test.com",
        phone: "",
        location: "",
        linkedin: "",
        website: "",
      },
      summary: "No markdown",
      experience: [
        { id: "1", company: "A", position: "B", startDate: "2020", endDate: "2024", description: "<p>Already HTML</p>" },
      ],
      education: [],
      skills: [],
    };

    const result = migrateCVData(newData);
    expect(result.personalInfo.fullName).toBe("John");
    expect(result.experience[0].description).toBe("<p>Already HTML</p>");
  });

  it("ensures all fields exist even with minimal input", () => {
    const result = migrateCVData({});
    expect(result.personalInfo.fullName).toBe("");
    expect(result.summary).toBe("");
    expect(result.experience).toEqual([]);
    expect(result.education).toEqual([]);
    expect(result.skills).toEqual([]);
    expect(result.courses).toEqual([]);
    expect(result.certifications).toEqual([]);
    expect(result.awards).toEqual([]);
    expect(result.visibility).toBeDefined();
    expect(result.sidebarOrder).toEqual(["contact", "summary", "skills"]);
  });

  it("migrates experience bullet arrays to HTML", () => {
    const data = {
      personalInfo: { fullName: "" },
      experience: [
        {
          id: "1",
          company: "A",
          position: "B",
          startDate: "2020",
          endDate: "2024",
          description: [
            { text: "Did stuff", type: "bullet" },
            { text: "More stuff", type: "bullet" },
          ],
        },
      ],
    };

    const result = migrateCVData(data);
    expect(result.experience[0].description).toBe(
      "<ul><li><p>Did stuff</p></li><li><p>More stuff</p></li></ul>"
    );
  });

  it("migrates education markdown bold", () => {
    const data = {
      personalInfo: { fullName: "" },
      education: [
        {
          id: "1",
          institution: "MIT",
          degree: "CS",
          startDate: "2020",
          endDate: "2024",
          description: "Focus on **machine learning**",
        },
      ],
    };

    const result = migrateCVData(data);
    expect(result.education[0].description).toBe(
      "Focus on <strong>machine learning</strong>"
    );
  });
});
