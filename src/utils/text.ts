import { basename } from "node:path";

import type { BookChunk } from "../types.js";

export function normalizeExtractedText(input: string): string {
  const unixText = input.replace(/\r\n/g, "\n").replace(/\u0000/g, "");
  const paragraphs = unixText
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .replace(/-\n(?=\w)/g, "")
        .replace(/(?<!\n)\n(?!\n)/g, " ")
        .replace(/[ \t]+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  return paragraphs.join("\n\n").trim();
}

export function stripFrontMatter(input: string): string {
  if (!input.startsWith("---\n")) {
    return input;
  }

  const end = input.indexOf("\n---\n", 4);
  if (end === -1) {
    return input;
  }

  return input.slice(end + 5);
}

export function estimateWordCount(input: string): number {
  const words = input.trim().match(/\S+/g);
  return words ? words.length : 0;
}

export function deriveTitleFromFilename(filePath: string): string {
  const raw = basename(filePath).replace(/\.[^.]+$/, "");
  return raw
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function deriveTitleFromText(input: string): string | undefined {
  const markdownHeading = input.match(/^\s*#\s+(.+)$/m);
  if (markdownHeading?.[1]) {
    return markdownHeading[1].trim();
  }

  const firstMeaningfulLine = input
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstMeaningfulLine || firstMeaningfulLine.length > 120) {
    return undefined;
  }

  return firstMeaningfulLine.replace(/^#+\s*/, "").trim();
}

function overlapSeed(paragraphs: string[], overlap: number): string[] {
  if (overlap <= 0 || paragraphs.length === 0) {
    return [];
  }

  const selected: string[] = [];
  let total = 0;

  for (let index = paragraphs.length - 1; index >= 0; index -= 1) {
    const paragraph = paragraphs[index];
    const cost = paragraph.length + (selected.length > 0 ? 2 : 0);
    if (selected.length > 0 && total + cost > overlap) {
      break;
    }

    selected.unshift(paragraph);
    total += cost;
  }

  return selected;
}

export function chunkText(input: string, maxChars: number, overlap: number): BookChunk[] {
  const paragraphs = input
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [];
  }

  const chunks: BookChunk[] = [];
  let currentParagraphs: string[] = [];
  let currentLength = 0;

  const flush = (): void => {
    if (currentParagraphs.length === 0) {
      return;
    }

    const text = currentParagraphs.join("\n\n");
    chunks.push({
      index: chunks.length,
      text,
      characterCount: text.length,
      wordCount: estimateWordCount(text),
    });

    currentParagraphs = overlapSeed(currentParagraphs, overlap);
    currentLength = currentParagraphs.join("\n\n").length;
  };

  for (const paragraph of paragraphs) {
    const separatorCost = currentParagraphs.length > 0 ? 2 : 0;
    const nextLength = currentLength + separatorCost + paragraph.length;

    if (nextLength > maxChars && currentParagraphs.length > 0) {
      flush();
    }

    if (paragraph.length > maxChars) {
      const words = paragraph.split(/\s+/);
      let buffer = "";

      for (const word of words) {
        const candidate = buffer ? `${buffer} ${word}` : word;
        if (candidate.length > maxChars && buffer) {
          if (currentParagraphs.length > 0) {
            flush();
          }

          currentParagraphs = [buffer];
          currentLength = buffer.length;
          flush();
          buffer = word;
          continue;
        }

        buffer = candidate;
      }

      if (buffer) {
        if (currentParagraphs.length > 0) {
          flush();
        }

        currentParagraphs = [buffer];
        currentLength = buffer.length;
      }

      continue;
    }

    currentParagraphs.push(paragraph);
    currentLength = currentParagraphs.join("\n\n").length;
  }

  flush();

  return chunks;
}
