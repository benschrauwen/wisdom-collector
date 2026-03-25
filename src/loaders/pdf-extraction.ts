import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

import { PDFParse } from "pdf-parse";

import type { BookLoadDetails } from "../types.js";
import { estimateWordCount, normalizeExtractedText } from "../utils/text.js";

const execFile = promisify(execFileCallback);
const DEFAULT_OCR_LANGUAGE = process.env.WISDOM_COLLECTOR_OCR_LANG?.trim() || "eng";
const MIN_WORDS_PER_PAGE_FOR_TEXT_LAYER = 25;
const MIN_CHARACTERS_PER_PAGE_FOR_TEXT_LAYER = 150;
const LARGE_PDF_BYTE_THRESHOLD = 500_000;
const MIN_WORDS_FOR_LARGE_PDF = 250;
const PDFINFO_TIMEOUT_MS = 15_000;
const PDFTOTEXT_TIMEOUT_MS = 60_000;
const PDFTOPPM_PAGE_TIMEOUT_MS = 60_000;
const TESSERACT_PAGE_TIMEOUT_MS = 120_000;
const OCR_PROGRESS_INTERVAL = 10;

interface PdfDocumentInfo {
  title?: string;
  author?: string;
  pageCount?: number;
}

interface PdfTextLayerResult {
  text: string;
  note: string;
}

interface PdfOcrResult {
  text: string;
  pageCount: number;
  note: string;
}

export interface PdfOcrDiagnostic {
  shouldUseOcr: boolean;
  reason?: string;
}

export interface ExtractedPdfDocument {
  text: string;
  title?: string;
  author?: string;
  loadDetails: BookLoadDetails;
}

interface PdfExtractionOptions {
  logger?: (message: string) => void;
}

function isMissingCommandError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorWithCode = error as { code?: unknown };
  return typeof errorWithCode.code === "string" && errorWithCode.code === "ENOENT";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function parsePdfInfoOutput(output: string): PdfDocumentInfo {
  const title = output.match(/^Title:\s+(.+)$/m)?.[1]?.trim() || undefined;
  const author = output.match(/^Author:\s+(.+)$/m)?.[1]?.trim() || undefined;
  const pagesMatch = output.match(/^Pages:\s+(\d+)$/m)?.[1];
  const pageCount = pagesMatch ? Number.parseInt(pagesMatch, 10) : undefined;

  return { title, author, pageCount };
}

async function readPdfInfoFromCli(inputPath: string): Promise<PdfDocumentInfo | undefined> {
  try {
    const { stdout } = await execFile("pdfinfo", [inputPath], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      timeout: PDFINFO_TIMEOUT_MS,
    });
    return parsePdfInfoOutput(stdout);
  } catch (error: unknown) {
    if (isMissingCommandError(error)) {
      return undefined;
    }

    return undefined;
  }
}

async function readPdfInfo(inputPath: string, parser: PDFParse): Promise<PdfDocumentInfo> {
  const cliInfo = await readPdfInfoFromCli(inputPath);
  const parserInfo = await parser.getInfo().catch(() => undefined);
  const infoDictionary = parserInfo?.info as { Title?: string; Author?: string } | undefined;
  const parserPageCount =
    parserInfo &&
    typeof parserInfo === "object" &&
    "total" in parserInfo &&
    typeof parserInfo.total === "number"
      ? parserInfo.total
      : undefined;

  return {
    title: cliInfo?.title ?? infoDictionary?.Title?.trim(),
    author: cliInfo?.author ?? infoDictionary?.Author?.trim(),
    pageCount: cliInfo?.pageCount ?? parserPageCount,
  };
}

async function extractTextLayerWithPdftotext(inputPath: string): Promise<string> {
  const tempDirectory = await mkdtemp(join(tmpdir(), "wisdom-collector-pdftotext-"));
  const outputPath = join(tempDirectory, "document.txt");

  try {
    await execFile("pdftotext", ["-layout", "-enc", "UTF-8", inputPath, outputPath], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      timeout: PDFTOTEXT_TIMEOUT_MS,
    });
    return await readFile(outputPath, "utf8");
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

async function extractPdfTextLayer(inputPath: string, parser: PDFParse): Promise<PdfTextLayerResult> {
  try {
    const text = await extractTextLayerWithPdftotext(inputPath);
    return {
      text,
      note: "Extracted embedded PDF text with pdftotext.",
    };
  } catch (error: unknown) {
    const textResult = await parser.getText();
    const note = isMissingCommandError(error)
      ? "pdftotext was unavailable, so the loader fell back to pdf-parse."
      : `pdftotext failed, so the loader fell back to pdf-parse: ${errorMessage(error)}`;

    return {
      text: textResult.text,
      note,
    };
  }
}

function shouldLogOcrProgress(pageNumber: number, pageCount: number): boolean {
  return pageNumber === 1 || pageNumber === pageCount || pageNumber % OCR_PROGRESS_INTERVAL === 0;
}

async function extractPdfTextWithOcr(
  inputPath: string,
  pageCount: number | undefined,
  logger?: (message: string) => void,
): Promise<PdfOcrResult> {
  const tempDirectory = await mkdtemp(join(tmpdir(), "wisdom-collector-pdf-ocr-"));

  try {
    if (!pageCount || pageCount <= 0) {
      throw new Error("OCR could not determine the number of pages in the PDF.");
    }

    logger?.(`Starting OCR for ${pageCount} page(s). This can take several minutes for scanned books.`);

    const pageTexts: string[] = [];
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      if (shouldLogOcrProgress(pageNumber, pageCount)) {
        logger?.(`OCR progress: page ${pageNumber}/${pageCount}...`);
      }

      const pagePrefix = join(tempDirectory, `page-${pageNumber}`);
      const imagePath = `${pagePrefix}.png`;
      await execFile(
        "pdftoppm",
        ["-f", String(pageNumber), "-l", String(pageNumber), "-singlefile", "-r", "300", "-png", inputPath, pagePrefix],
        {
          encoding: "utf8",
          maxBuffer: 1024 * 1024,
          timeout: PDFTOPPM_PAGE_TIMEOUT_MS,
        },
      );

      const { stdout } = await execFile(
        "tesseract",
        [imagePath, "stdout", "-l", DEFAULT_OCR_LANGUAGE, "--psm", "1", "quiet"],
        {
          encoding: "utf8",
          maxBuffer: 16 * 1024 * 1024,
          timeout: TESSERACT_PAGE_TIMEOUT_MS,
        },
      );
      pageTexts.push(stdout);
      await rm(imagePath, { force: true });
    }

    logger?.(`Finished OCR for ${pageCount} page(s).`);

    return {
      text: pageTexts.join("\n\n"),
      pageCount,
      note: `Used OCR via pdftoppm + tesseract (${DEFAULT_OCR_LANGUAGE}) because the PDF looked image-based.`,
    };
  } catch (error: unknown) {
    if (isMissingCommandError(error)) {
      throw new Error(
        "The PDF looks image-based, but OCR tools are unavailable. Install both `pdftoppm` and `tesseract`, or provide a text export.",
      );
    }

    throw new Error(`OCR failed for ${inputPath}: ${errorMessage(error)}`);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

export function diagnosePdfTextForOcr(
  text: string,
  pageCount: number | undefined,
  sourceByteCount: number,
): PdfOcrDiagnostic {
  const normalized = normalizeExtractedText(text);
  const wordCount = estimateWordCount(normalized);

  if (!normalized) {
    return {
      shouldUseOcr: true,
      reason: "Direct PDF text extraction returned no usable text.",
    };
  }

  if (pageCount && pageCount >= 3) {
    const wordsPerPage = wordCount / pageCount;
    const charactersPerPage = normalized.length / pageCount;

    if (
      wordsPerPage < MIN_WORDS_PER_PAGE_FOR_TEXT_LAYER ||
      charactersPerPage < MIN_CHARACTERS_PER_PAGE_FOR_TEXT_LAYER
    ) {
      return {
        shouldUseOcr: true,
        reason: `Direct PDF text looked sparse at about ${Math.round(wordsPerPage)} words per page across ${pageCount} pages.`,
      };
    }
  }

  if (sourceByteCount >= LARGE_PDF_BYTE_THRESHOLD && wordCount < MIN_WORDS_FOR_LARGE_PDF) {
    return {
      shouldUseOcr: true,
      reason: "The PDF file was large, but the extracted text layer was unusually small.",
    };
  }

  return {
    shouldUseOcr: false,
  };
}

export async function extractPdfDocument(
  inputPath: string,
  options: PdfExtractionOptions = {},
): Promise<ExtractedPdfDocument> {
  const data = await readFile(inputPath);
  const parser = new PDFParse({ data });
  const { logger } = options;

  try {
    logger?.("Inspecting PDF metadata...");
    const pdfInfo = await readPdfInfo(inputPath, parser);
    logger?.(
      pdfInfo.pageCount
        ? `Trying embedded PDF text extraction for ${pdfInfo.pageCount} page(s)...`
        : "Trying embedded PDF text extraction...",
    );
    const textLayer = await extractPdfTextLayer(inputPath, parser);
    const directText = normalizeExtractedText(textLayer.text);
    const diagnostic = diagnosePdfTextForOcr(directText, pdfInfo.pageCount, data.byteLength);
    let text = directText;
    let extractionMethod: BookLoadDetails["extractionMethod"] = "pdf-text";
    const extractionNotes = [textLayer.note];
    let pageCount = pdfInfo.pageCount;

    if (diagnostic.shouldUseOcr) {
      extractionNotes.push(diagnostic.reason ?? "The PDF text layer looked too sparse, so OCR was attempted.");
      logger?.(
        diagnostic.reason
          ? `${diagnostic.reason} Starting OCR fallback...`
          : "The PDF text layer looked too sparse. Starting OCR fallback...",
      );

      try {
        const ocrResult = await extractPdfTextWithOcr(inputPath, pdfInfo.pageCount, logger);
        const ocrText = normalizeExtractedText(ocrResult.text);
        const ocrDiagnostic = diagnosePdfTextForOcr(ocrText, ocrResult.pageCount, data.byteLength);
        const directWordCount = estimateWordCount(directText);
        const ocrWordCount = estimateWordCount(ocrText);

        if (!ocrDiagnostic.shouldUseOcr || ocrWordCount > directWordCount) {
          text = ocrText;
          extractionMethod = "pdf-ocr";
          pageCount = ocrResult.pageCount;
          extractionNotes.push(ocrResult.note);
        } else {
          extractionNotes.push("OCR ran, but the original PDF text layer still looked more complete, so it was kept.");
        }
      } catch (error: unknown) {
        if (!directText.trim()) {
          throw error;
        }

        extractionNotes.push(`OCR fallback could not replace the text layer: ${errorMessage(error)}`);
      }
    }

    return {
      text,
      title: pdfInfo.title,
      author: pdfInfo.author,
      loadDetails: {
        sourceByteCount: data.byteLength,
        pageCount,
        extractionMethod,
        extractionNotes,
      },
    };
  } finally {
    await parser.destroy();
  }
}
