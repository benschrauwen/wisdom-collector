import type { Api, KnownProvider, Model, ThinkingLevel } from "@mariozechner/pi-ai";

export type AnyModel = Model<Api>;

export type BookFormat = "pdf" | "md" | "txt" | "text";

export interface BookMetadata {
  title: string;
  author?: string;
  sourcePath: string;
  format: BookFormat;
}

export interface LoadedBook extends BookMetadata {
  text: string;
  wordCount: number;
  characterCount: number;
}

export interface BookChunk {
  index: number;
  text: string;
  characterCount: number;
  wordCount: number;
}

export interface ChunkAnalysis {
  chunkIndex: number;
  overview: string;
  keyIdeas: string[];
  actionablePrinciples: string[];
  decisionRules: string[];
  agentWorkflows: string[];
  starterPrompts: string[];
  usefulQuotes: string[];
}

export interface SkillFileBlueprint {
  slug: string;
  skillTitle: string;
  description: string;
  skillBody: string;
}

export interface SkillBlueprint extends SkillFileBlueprint {
  subskills: SkillFileBlueprint[];
}

export interface GeneratedSubskill {
  outputDirectory: string;
  blueprint: SkillFileBlueprint;
  markdown: string;
}

export interface GeneratedSkill {
  metadata: BookMetadata;
  chunkCount: number;
  outputDirectory: string;
  blueprint: SkillBlueprint;
  markdown: string;
  subskills: GeneratedSubskill[];
}

export interface ExtractSkillOptions {
  inputPath: string;
  outputRoot: string;
  provider: KnownProvider;
  modelId: string;
  thinkingLevel: ThinkingLevel;
  chunkSize: number;
  overlap: number;
  maxChunks?: number;
  titleOverride?: string;
  authorOverride?: string;
}
