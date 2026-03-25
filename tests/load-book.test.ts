import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import { loadBook } from "../src/loaders/load-book.js";

describe("loadBook", () => {
  it("loads plain text and derives metadata", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wisdom-collector-"));
    const path = join(dir, "sample_book.txt");
    await writeFile(path, "First line title\n\nBody text here.", "utf8");

    try {
      const book = await loadBook(path);
      expect(book.format).toBe("txt");
      expect(book.text).toContain("Body text");
      expect(book.wordCount).toBeGreaterThan(0);
      expect(book.title).toBe("First line title");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("strips front matter for markdown", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wisdom-collector-"));
    const path = join(dir, "doc.md");
    await writeFile(
      path,
      "---\ntitle: Ignored\n---\n\n# Real Title\n\nContent.",
      "utf8",
    );

    try {
      const book = await loadBook(path);
      expect(book.text).toContain("Content.");
      expect(book.title).toBe("Real Title");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("throws when file has no extractable text", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wisdom-collector-"));
    const path = join(dir, "empty.txt");
    await writeFile(path, "   \n  \n  ", "utf8");

    try {
      await expect(loadBook(path)).rejects.toThrow(/No text could be extracted/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
