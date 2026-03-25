import { describe, expect, it } from "vitest";

import { formatBookLoadSummary } from "../src/utils/book-load-summary.js";
import type { LoadedBook } from "../src/types.js";

function sampleBook(overrides: Partial<LoadedBook> = {}): LoadedBook {
  return {
    title: "Old Management Book",
    author: "Ada Example",
    sourcePath: "/tmp/book.pdf",
    format: "pdf",
    text: "body text",
    wordCount: 125_000,
    characterCount: 720_000,
    loadDetails: {
      sourceByteCount: 22_000_000,
      pageCount: 312,
      extractionMethod: "pdf-ocr",
      extractionNotes: ["Used OCR via pdftoppm + tesseract (eng) because the PDF looked image-based."],
    },
    ...overrides,
  };
}

describe("formatBookLoadSummary", () => {
  it("renders a concise work-size summary", () => {
    const summary = formatBookLoadSummary(sampleBook(), {
      totalChunks: 9,
      processedChunks: 9,
      chunkSize: 100_000,
      overlap: 1_200,
    });

    expect(summary).toContain('Loaded "Old Management Book" by Ada Example.');
    expect(summary).toContain("Source: PDF, 312 pages, OCR from scanned/image-based pages");
    expect(summary).toContain("Text footprint: 720,000 characters, 125,000 words.");
    expect(summary).toContain("Chunk plan: 9 chunk(s)");
  });

  it("mentions max-chunk limiting when only part of the book will be processed", () => {
    const summary = formatBookLoadSummary(sampleBook({ format: "md" }), {
      totalChunks: 14,
      processedChunks: 3,
      chunkSize: 50_000,
      overlap: 500,
    });

    expect(summary).toContain("Chunk plan: 14 total chunk(s); processing 3 because of --max-chunks.");
  });
});
