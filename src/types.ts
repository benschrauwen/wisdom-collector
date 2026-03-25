import type { Api, KnownProvider, Model, ThinkingLevel } from "@mariozechner/pi-ai";

export type AnyModel = Model<Api>;

export type BookFormat = "pdf" | "md" | "txt" | "text";
export type BookExtractionMethod = "text-file" | "pdf-text" | "pdf-ocr";

export interface BookMetadata {
  title: string;
  author?: string;
  sourcePath: string;
  format: BookFormat;
}

export interface InferredBookMetadata {
  title: string;
  author?: string;
}

export interface BookLoadDetails {
  sourceByteCount: number;
  pageCount?: number;
  extractionMethod: BookExtractionMethod;
  extractionNotes: string[];
}

export interface LoadedBook extends BookMetadata {
  text: string;
  wordCount: number;
  characterCount: number;
  loadDetails: BookLoadDetails;
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
  notes: string;
}

export interface SkillFileBlueprint {
  slug: string;
  skillTitle: string;
  description: string;
  skillBody: string;
}

export interface SkillSource {
  title: string;
  author?: string;
}

export interface SkillBlueprint extends SkillFileBlueprint {
  subskills: SkillFileBlueprint[];
}

export interface ExistingSkill extends SkillFileBlueprint {
  filePath: string;
  sourceMentions: SkillSource[];
}

export type SkillOverlapReviewOutcome = "keep" | "merge-with-existing" | "drop-as-duplicate";

export interface SkillOverlapDecision {
  candidateSlug: string;
  outcome: SkillOverlapReviewOutcome;
  matchedExistingSkillSlug?: string;
  matchedCandidateSkillSlug?: string;
  rationale: string;
}

export interface SkillOverlapReview {
  summary: string;
  decisions: SkillOverlapDecision[];
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
