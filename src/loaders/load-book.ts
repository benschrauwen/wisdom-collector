import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { PDFParse } from "pdf-parse";

import type { BookFormat, LoadedBook } from "../types.js";
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
  const data = await readFile(inputPath);
  const parser = new PDFParse({ data });

  try {
    const info = await parser.getInfo().catch(() => undefined);
    const textResult = await parser.getText();
    const text = normalizeExtractedText(textResult.text);
    const infoDictionary = info?.info as { Title?: string; Author?: string } | undefined;
    const title =
      overrides.titleOverride ??
      infoDictionary?.Title?.trim() ??
      deriveTitleFromFilename(inputPath);
    const author = overrides.authorOverride ?? infoDictionary?.Author?.trim() ?? undefined;

    return {
      title,
      author,
      sourcePath: inputPath,
      format: "pdf",
      text,
      wordCount: estimateWordCount(text),
      characterCount: text.length,
    };
  } finally {
    await parser.destroy();
  }
}

async function loadTextBook(
  inputPath: string,
  format: Exclude<BookFormat, "pdf">,
  overrides: LoadBookOverrides,
): Promise<LoadedBook> {
  const raw = await readFile(inputPath, "utf8");
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
