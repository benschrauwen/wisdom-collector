import type { LoadedBook } from "../types.js";

interface BookLoadSummaryOptions {
  totalChunks: number;
  processedChunks: number;
  chunkSize: number;
  overlap: number;
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

function formatByteCount(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function describeFormat(book: LoadedBook): string {
  if (book.format === "pdf") {
    const pageCount = book.loadDetails.pageCount ? `${formatCount(book.loadDetails.pageCount)} pages, ` : "";
    const extraction =
      book.loadDetails.extractionMethod === "pdf-ocr"
        ? "OCR from scanned/image-based pages"
        : "embedded text extraction";

    return `PDF, ${pageCount}${extraction}`;
  }

  if (book.format === "md") {
    return "Markdown text file";
  }

  if (book.format === "txt") {
    return "Plain text file";
  }

  return "Text-like file";
}

export function formatBookLoadSummary(book: LoadedBook, options: BookLoadSummaryOptions): string {
  const lines = [
    `Loaded "${book.title}"${book.author ? ` by ${book.author}` : ""}.`,
    `Source: ${describeFormat(book)} from ${formatByteCount(book.loadDetails.sourceByteCount)}.`,
    `Text footprint: ${formatCount(book.characterCount)} characters, ${formatCount(book.wordCount)} words.`,
    options.processedChunks === options.totalChunks
      ? `Chunk plan: ${formatCount(options.totalChunks)} chunk(s) at ${formatCount(options.chunkSize)} chars with ${formatCount(options.overlap)} overlap.`
      : `Chunk plan: ${formatCount(options.totalChunks)} total chunk(s); processing ${formatCount(options.processedChunks)} because of --max-chunks.`,
  ];

  for (const note of book.loadDetails.extractionNotes) {
    lines.push(`Note: ${note}`);
  }

  return lines.join("\n");
}
