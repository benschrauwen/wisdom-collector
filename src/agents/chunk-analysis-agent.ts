import { Type, type Static, type ThinkingLevel } from "@mariozechner/pi-ai";

import { runStructuredToolAgent } from "./run-structured-tool-agent.js";
import { buildChunkAnalysisSystemPrompt, buildChunkAnalysisUserPrompt } from "../prompts/chunk-analysis.js";
import type { AnyModel, BookChunk, BookMetadata, ChunkAnalysis } from "../types.js";

const chunkAnalysisSchema = Type.Object({
  overview: Type.String({ minLength: 1 }),
  notes: Type.String({ minLength: 1 }),
});

type ChunkAnalysisPayload = Static<typeof chunkAnalysisSchema>;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanMarkdown(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  const fencedMatch = normalized.match(/^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?```$/i);
  return fencedMatch ? fencedMatch[1].trim() : normalized;
}

function toChunkAnalysis(chunkIndex: number, payload: ChunkAnalysisPayload): ChunkAnalysis {
  return {
    chunkIndex,
    overview: cleanText(payload.overview),
    notes: cleanMarkdown(payload.notes),
  };
}

interface AnalyzeChunkOptions {
  model: AnyModel;
  thinkingLevel: ThinkingLevel;
  book: BookMetadata;
  chunk: BookChunk;
  totalChunks: number;
}

export async function analyzeChunkWithAgent(options: AnalyzeChunkOptions): Promise<ChunkAnalysis> {
  const payload = await runStructuredToolAgent({
    model: options.model,
    thinkingLevel: options.thinkingLevel,
    systemPrompt: buildChunkAnalysisSystemPrompt(options.book),
    userPrompt: buildChunkAnalysisUserPrompt(options.book, options.chunk, options.totalChunks),
    tool: {
      name: "save_chunk_analysis",
      label: "Save Chunk Analysis",
      description: "Persist a concise overview and freeform notes for the current book chunk.",
      parameters: chunkAnalysisSchema,
    },
  });

  return toChunkAnalysis(options.chunk.index, payload);
}
