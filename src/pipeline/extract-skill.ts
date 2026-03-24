import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { getEnvApiKey, getModels } from "@mariozechner/pi-ai";

import { analyzeChunkWithAgent } from "../agents/chunk-analysis-agent.js";
import { synthesizeSkillWithAgent } from "../agents/skill-synthesis-agent.js";
import { loadBook } from "../loaders/load-book.js";
import { renderSkillMarkdown } from "../renderers/render-skill-markdown.js";
import type { AnyModel, ChunkAnalysis, ExtractSkillOptions, GeneratedSkill } from "../types.js";
import { chunkText } from "../utils/text.js";

function resolveModel(provider: ExtractSkillOptions["provider"], modelId: string): AnyModel {
  const availableModels = getModels(provider);
  const model = availableModels.find((candidate) => candidate.id === modelId);

  if (!model) {
    const sampleModels = availableModels
      .slice(0, 12)
      .map((candidate) => candidate.id)
      .join(", ");

    throw new Error(
      `Model "${modelId}" was not found for provider "${provider}". Sample models: ${sampleModels}`,
    );
  }

  return model;
}

function warnIfCredentialsAreMissing(provider: ExtractSkillOptions["provider"]): void {
  const apiKey = getEnvApiKey(provider);

  if (!apiKey) {
    console.warn(
      `No environment API key was detected for "${provider}". If you rely on OAuth or provider-specific auth, this may still be fine.`,
    );
  }
}

export async function extractSkillFromBook(options: ExtractSkillOptions): Promise<GeneratedSkill> {
  warnIfCredentialsAreMissing(options.provider);

  const model = resolveModel(options.provider, options.modelId);
  const book = await loadBook(options.inputPath, {
    titleOverride: options.titleOverride,
    authorOverride: options.authorOverride,
  });

  const allChunks = chunkText(book.text, options.chunkSize, options.overlap);
  const chunks =
    options.maxChunks && options.maxChunks > 0 ? allChunks.slice(0, options.maxChunks) : allChunks;

  if (chunks.length === 0) {
    throw new Error("No chunks were produced from the extracted book text.");
  }

  const chunkAnalyses: ChunkAnalysis[] = [];

  for (const chunk of chunks) {
    console.log(`Analyzing chunk ${chunk.index + 1}/${chunks.length}...`);
    const analysis = await analyzeChunkWithAgent({
      model,
      thinkingLevel: options.thinkingLevel,
      book,
      chunk,
      totalChunks: chunks.length,
    });
    chunkAnalyses.push(analysis);
  }

  console.log("Synthesizing final skill...");
  const blueprint = await synthesizeSkillWithAgent({
    model,
    thinkingLevel: options.thinkingLevel,
    book,
    chunkAnalyses,
  });

  const markdown = renderSkillMarkdown(blueprint);
  const outputDirectory = resolve(options.outputRoot, blueprint.slug);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(join(outputDirectory, "SKILL.md"), markdown, "utf8");

  return {
    metadata: {
      title: book.title,
      author: book.author,
      sourcePath: book.sourcePath,
      format: book.format,
    },
    chunkCount: chunks.length,
    outputDirectory,
    blueprint,
    markdown,
  };
}
