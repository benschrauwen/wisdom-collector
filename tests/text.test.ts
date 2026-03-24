import { describe, expect, it } from "vitest";

import {
  chunkText,
  deriveTitleFromFilename,
  deriveTitleFromText,
  estimateWordCount,
  normalizeExtractedText,
  stripFrontMatter,
} from "../src/utils/text.js";

describe("normalizeExtractedText", () => {
  it("converts CRLF to LF and removes NUL", () => {
    expect(normalizeExtractedText("a\r\nb\0c")).toBe("a bc");
  });

  it("joins hyphenated line breaks", () => {
    expect(normalizeExtractedText("word-\nwrap")).toBe("wordwrap");
  });

  it("merges single newlines within paragraphs", () => {
    expect(normalizeExtractedText("one\ntwo")).toBe("one two");
  });

  it("preserves paragraph breaks", () => {
    expect(normalizeExtractedText("a\n\nb")).toBe("a\n\nb");
  });
});

describe("stripFrontMatter", () => {
  it("returns input unchanged when no front matter", () => {
    expect(stripFrontMatter("hello")).toBe("hello");
  });

  it("removes YAML front matter from markdown", () => {
    const input = "---\ntitle: T\n---\n\nBody";
    expect(stripFrontMatter(input)).toBe("\nBody");
  });

  it("returns input if closing delimiter is missing", () => {
    const input = "---\ntitle: T\nno close";
    expect(stripFrontMatter(input)).toBe(input);
  });
});

describe("estimateWordCount", () => {
  it("counts whitespace-separated tokens", () => {
    expect(estimateWordCount("  one two three  ")).toBe(3);
  });

  it("returns 0 for empty or whitespace", () => {
    expect(estimateWordCount("   ")).toBe(0);
  });
});

describe("deriveTitleFromFilename", () => {
  it("title-cases stem without extension", () => {
    expect(deriveTitleFromFilename("/path/my-great_book.pdf")).toBe("My Great Book");
  });
});

describe("deriveTitleFromText", () => {
  it("prefers first markdown H1", () => {
    expect(deriveTitleFromText("ignored\n\n# Chapter One\nbody")).toBe("Chapter One");
  });

  it("uses first short line when no heading", () => {
    expect(deriveTitleFromText("\n\nShort title\nrest")).toBe("Short title");
  });

  it("returns undefined for long first line", () => {
    const long = "x".repeat(121);
    expect(deriveTitleFromText(long)).toBeUndefined();
  });
});

describe("chunkText", () => {
  it("returns empty array for empty input", () => {
    expect(chunkText("", 100, 0)).toEqual([]);
  });

  it("keeps paragraph boundaries in a single chunk when under maxChars", () => {
    const chunks = chunkText("a\n\nb", 100, 0);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ index: 0, text: "a\n\nb", wordCount: 2 });
  });

  it("flushes when adding a paragraph would exceed maxChars", () => {
    const chunks = chunkText("aa\n\nbb", 3, 0);
    expect(chunks.map((c) => c.text)).toEqual(["aa", "bb"]);
  });

  it("includes overlap from previous chunk tail", () => {
    const chunks = chunkText("one block\n\ntwo block", 15, 8);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[1].text).toContain("two block");
  });
});
