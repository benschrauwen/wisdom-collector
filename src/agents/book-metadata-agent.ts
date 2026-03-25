import { Type, type Static, type ThinkingLevel } from "@mariozechner/pi-ai";

import { runStructuredToolAgent } from "./run-structured-tool-agent.js";
import { buildBookMetadataSystemPrompt, buildBookMetadataUserPrompt } from "../prompts/book-metadata.js";
import type { AnyModel, BookMetadata, InferredBookMetadata } from "../types.js";

const bookMetadataSchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  author: Type.String(),
});

type BookMetadataPayload = Static<typeof bookMetadataSchema>;

function normalizeOptionalText(value: string): string | undefined {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function toInferredBookMetadata(payload: BookMetadataPayload): InferredBookMetadata {
  return {
    title: payload.title.replace(/\s+/g, " ").trim(),
    author: normalizeOptionalText(payload.author),
  };
}

interface InferBookMetadataOptions {
  model: AnyModel;
  thinkingLevel: ThinkingLevel;
  book: BookMetadata;
  openingExcerpt: string;
}

export async function inferBookMetadataWithAgent(
  options: InferBookMetadataOptions,
): Promise<InferredBookMetadata> {
  const payload = await runStructuredToolAgent({
    model: options.model,
    thinkingLevel: options.thinkingLevel,
    systemPrompt: buildBookMetadataSystemPrompt(options.book),
    userPrompt: buildBookMetadataUserPrompt(options.book, options.openingExcerpt),
    tool: {
      name: "save_book_metadata",
      label: "Save Book Metadata",
      description: "Persist the inferred title and author for the current source document.",
      parameters: bookMetadataSchema,
    },
  });

  return toInferredBookMetadata(payload);
}
