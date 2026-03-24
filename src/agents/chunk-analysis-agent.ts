import { Type, type Static, type ThinkingLevel } from "@mariozechner/pi-ai";

import { runStructuredToolAgent } from "./run-structured-tool-agent.js";
import { buildChunkAnalysisSystemPrompt, buildChunkAnalysisUserPrompt } from "../prompts/chunk-analysis.js";
import type { AnyModel, BookChunk, BookMetadata, ChunkAnalysis } from "../types.js";

const chunkAnalysisSchema = Type.Object({
  chunkIndex: Type.Integer({ minimum: 0 }),
  overview: Type.String({ minLength: 1 }),
  keyIdeas: Type.Array(Type.String({ minLength: 1 })),
  actionablePrinciples: Type.Array(Type.String({ minLength: 1 })),
  decisionRules: Type.Array(Type.String({ minLength: 1 })),
  agentWorkflows: Type.Array(Type.String({ minLength: 1 })),
  starterPrompts: Type.Array(Type.String({ minLength: 1 })),
  usefulQuotes: Type.Array(Type.String({ minLength: 1 })),
});

type ChunkAnalysisPayload = Static<typeof chunkAnalysisSchema>;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanList(values: string[]): string[] {
  return values.map(cleanText).filter(Boolean);
}

function toChunkAnalysis(chunkIndex: number, payload: ChunkAnalysisPayload): ChunkAnalysis {
  return {
    chunkIndex,
    overview: cleanText(payload.overview),
    keyIdeas: cleanList(payload.keyIdeas),
    actionablePrinciples: cleanList(payload.actionablePrinciples),
    decisionRules: cleanList(payload.decisionRules),
    agentWorkflows: cleanList(payload.agentWorkflows),
    starterPrompts: cleanList(payload.starterPrompts),
    usefulQuotes: cleanList(payload.usefulQuotes),
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
      description: "Persist a structured analysis for the current book chunk.",
      parameters: chunkAnalysisSchema,
    },
  });

  return toChunkAnalysis(options.chunk.index, payload);
}
