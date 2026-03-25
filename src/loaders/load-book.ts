import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

import type { BookFormat, LoadedBook } from "../types.js";
import { extractPdfDocument } from "./pdf-extraction.js";
import {
  deriveTitleFromFilename,
  deriveTitleFromText,
  estimateWordCount,
  normalizeExtractedText,
  stripFrontMatter,
} from "../utils/text.js";

interface LoadBookOverrides {
  titleOverride?: string;
  authorOverride?: string;
  logger?: (message: string) => void;
}

function detectFormat(inputPath: string): BookFormat {
  const extension = extname(inputPath).toLowerCase();

  if (extension === ".pdf") {
    return "pdf";
  }

  if (extension === ".md" || extension === ".markdown") {
    return "md";
  }

  if (extension === ".txt") {
    return "txt";
  }

  return "text";
}

async function loadPdfBook(inputPath: string, overrides: LoadBookOverrides): Promise<LoadedBook> {
  const extractedPdf = await extractPdfDocument(inputPath, {
    logger: overrides.logger,
  });
  const title = overrides.titleOverride ?? extractedPdf.title?.trim() ?? deriveTitleFromFilename(inputPath);
  const author = overrides.authorOverride ?? extractedPdf.author?.trim() ?? undefined;

  return {
    title,
    author,
    sourcePath: inputPath,
    format: "pdf",
    text: extractedPdf.text,
    wordCount: estimateWordCount(extractedPdf.text),
    characterCount: extractedPdf.text.length,
    loadDetails: extractedPdf.loadDetails,
  };
}

async function loadTextBook(
  inputPath: string,
  format: Exclude<BookFormat, "pdf">,
  overrides: LoadBookOverrides,
): Promise<LoadedBook> {
  const rawBuffer = await readFile(inputPath);
  const raw = rawBuffer.toString("utf8");
  const withoutFrontMatter = format === "md" ? stripFrontMatter(raw) : raw;
  const text = normalizeExtractedText(withoutFrontMatter);
  const title =
    overrides.titleOverride ??
    deriveTitleFromText(withoutFrontMatter) ??
    deriveTitleFromFilename(inputPath);

  return {
    title,
    author: overrides.authorOverride,
    sourcePath: inputPath,
    format,
    text,
    wordCount: estimateWordCount(text),
    characterCount: text.length,
    loadDetails: {
      sourceByteCount: rawBuffer.byteLength,
      extractionMethod: "text-file",
      extractionNotes:
        format === "md"
          ? ["Loaded the source as UTF-8 text and removed markdown front matter before chunking."]
          : ["Loaded the source as UTF-8 text."],
    },
  };
}

export async function loadBook(
  inputPath: string,
  overrides: LoadBookOverrides = {},
): Promise<LoadedBook> {
  const resolvedPath = resolve(inputPath);
  const format = detectFormat(resolvedPath);
  const book =
    format === "pdf"
      ? await loadPdfBook(resolvedPath, overrides)
      : await loadTextBook(resolvedPath, format, overrides);

  if (!book.text.trim()) {
    throw new Error(`No text could be extracted from ${resolvedPath}.`);
  }

  return book;
}
