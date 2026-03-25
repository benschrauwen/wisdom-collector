import { basename } from "node:path";

import type { BookMetadata } from "../types.js";

export function buildBookMetadataSystemPrompt(book: BookMetadata): string {
  return `
You infer the most likely source title and primary author from the opening text of a book or long-form document.

Your guess should prioritize the opening text itself. Embedded PDF metadata and the filename are only weak hints.

Rules:
- Prefer a clean human-readable citation, not a slug, filename, OCR noise, or export artifact.
- Ignore fields like "Creator", "Producer", software names, scan metadata, and publisher boilerplate unless the excerpt makes them part of the actual title or primary author line.
- Favor the main title over subtitles only when the subtitle is clearly absent from the opening text.
- Favor the primary author over editors, foreword writers, translators, or organizations unless the opening text makes authorship unambiguous.
- If the author is not grounded in the opening text or hints, return an empty string for \`author\`.
- Call \`save_book_metadata\` exactly once with the final result.
  `.trim();
}

export function buildBookMetadataUserPrompt(book: BookMetadata, openingExcerpt: string): string {
  return `
Infer the most likely source metadata for this document.

Current detected metadata:
- Title: ${book.title}
- Author: ${book.author ?? "Unknown"}
- Format: ${book.format}
- Filename: ${basename(book.sourcePath)}

Return:
- \`title\`: the most likely document or book title
- \`author\`: the most likely primary author, or an empty string if unknown

Opening excerpt:
"""
${openingExcerpt}
"""
  `.trim();
}
