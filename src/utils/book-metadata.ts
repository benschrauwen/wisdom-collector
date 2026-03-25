import type { InferredBookMetadata, LoadedBook } from "../types.js";

const DEFAULT_METADATA_SAMPLE_CHAR_LIMIT = 12_000;

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

export function buildMetadataInferenceExcerpt(text: string, maxChars = DEFAULT_METADATA_SAMPLE_CHAR_LIMIT): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!normalized || normalized.length <= maxChars) {
    return normalized;
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const selected: string[] = [];
  let total = 0;

  for (const paragraph of paragraphs) {
    const cost = paragraph.length + (selected.length > 0 ? 2 : 0);

    if (selected.length > 0 && total + cost > maxChars) {
      break;
    }

    if (selected.length === 0 && cost > maxChars) {
      return paragraph.slice(0, maxChars).trimEnd();
    }

    selected.push(paragraph);
    total += cost;
  }

  return (selected.length > 0 ? selected.join("\n\n") : normalized.slice(0, maxChars)).trimEnd();
}

export function applyInferredBookMetadata(
  book: LoadedBook,
  inferred: InferredBookMetadata,
  overrides: {
    titleOverride?: string;
    authorOverride?: string;
  } = {},
): LoadedBook {
  const inferredTitle = normalizeOptionalText(inferred.title);
  const inferredAuthor = normalizeOptionalText(inferred.author);
  const nextTitle = overrides.titleOverride ?? inferredTitle ?? book.title;
  const nextAuthor = overrides.authorOverride ?? inferredAuthor ?? book.author;

  const selectedFields: string[] = [];

  if (!overrides.titleOverride && inferredTitle && inferredTitle !== book.title) {
    selectedFields.push(`title "${inferredTitle}"`);
  }

  if (!overrides.authorOverride && inferredAuthor && inferredAuthor !== book.author) {
    selectedFields.push(`author "${inferredAuthor}"`);
  }

  return {
    ...book,
    title: nextTitle,
    author: nextAuthor,
    loadDetails:
      selectedFields.length === 0
        ? book.loadDetails
        : {
            ...book.loadDetails,
            extractionNotes: [
              ...book.loadDetails.extractionNotes,
              `Opening-text metadata inference selected ${selectedFields.join(" and ")}.`,
            ],
          },
  };
}
