import { describe, expect, it } from "vitest";

import type { LoadedBook } from "../src/types.js";
import { applyInferredBookMetadata, buildMetadataInferenceExcerpt } from "../src/utils/book-metadata.js";

function createBook(overrides: Partial<LoadedBook> = {}): LoadedBook {
  return {
    title: "Creator: Adobe InDesign CS3 (5.0)",
    author: "Unknown Exporter",
    sourcePath: "/tmp/example.pdf",
    format: "pdf",
    text: "The First 90 Days\nMichael Watkins\n\nBody text.",
    wordCount: 8,
    characterCount: 44,
    loadDetails: {
      sourceByteCount: 1234,
      extractionMethod: "pdf-text",
      extractionNotes: ["Extracted embedded PDF text with pdftotext."],
    },
    ...overrides,
  };
}

describe("buildMetadataInferenceExcerpt", () => {
  it("keeps leading paragraphs up to the character limit", () => {
    const excerpt = buildMetadataInferenceExcerpt(
      ["Title page", "Author line", "Long paragraph that should not fit."].join("\n\n"),
      25,
    );

    expect(excerpt).toBe("Title page\n\nAuthor line");
  });

  it("falls back to truncating the first paragraph when needed", () => {
    const excerpt = buildMetadataInferenceExcerpt("A".repeat(40), 12);

    expect(excerpt).toBe("A".repeat(12));
  });
});

describe("applyInferredBookMetadata", () => {
  it("prefers inferred metadata over detected metadata", () => {
    const book = createBook();
    const updated = applyInferredBookMetadata(book, {
      title: "The First 90 Days",
      author: "Michael Watkins",
    });

    expect(updated.title).toBe("The First 90 Days");
    expect(updated.author).toBe("Michael Watkins");
    expect(updated.loadDetails.extractionNotes.at(-1)).toMatch(/Opening-text metadata inference selected/i);
  });

  it("respects explicit CLI overrides", () => {
    const book = createBook({
      title: "Manual Title",
      author: "Manual Author",
    });
    const updated = applyInferredBookMetadata(
      book,
      {
        title: "The First 90 Days",
        author: "Michael Watkins",
      },
      {
        titleOverride: "Manual Title",
        authorOverride: "Manual Author",
      },
    );

    expect(updated.title).toBe("Manual Title");
    expect(updated.author).toBe("Manual Author");
    expect(updated.loadDetails.extractionNotes).toHaveLength(book.loadDetails.extractionNotes.length);
  });

  it("keeps detected metadata when the inference returns blanks", () => {
    const book = createBook();
    const updated = applyInferredBookMetadata(book, {
      title: "   ",
      author: "   ",
    });

    expect(updated.title).toBe(book.title);
    expect(updated.author).toBe(book.author);
    expect(updated.loadDetails).toBe(book.loadDetails);
  });
});
