import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { getEnvApiKey, getModels } from "@mariozechner/pi-ai";

import { inferBookMetadataWithAgent } from "../agents/book-metadata-agent.js";
import { analyzeChunkWithAgent } from "../agents/chunk-analysis-agent.js";
import { finalizeSkillWithAgent } from "../agents/skill-finalization-agent.js";
import { reviewSkillOverlapWithAgent } from "../agents/skill-overlap-review-agent.js";
import { enrichSkillFamily } from "./enrich-skill-family.js";
import { loadExistingSkills } from "./load-existing-skills.js";
import { synthesizeSkillCandidateWithAgent } from "../agents/skill-synthesis-agent.js";
import { loadBook } from "../loaders/load-book.js";
import { updateReadmeOverview } from "./update-readme-overview.js";
import { renderSkillMarkdown } from "../renderers/render-skill-markdown.js";
import type { AnyModel, ChunkAnalysis, ExtractSkillOptions, GeneratedSkill, GeneratedSubskill, LoadedBook } from "../types.js";
import { applyInferredBookMetadata, buildMetadataInferenceExcerpt } from "../utils/book-metadata.js";
import { formatBookLoadSummary } from "../utils/book-load-summary.js";
import { selectExistingSkillsForFinalization } from "../utils/skill-overlap.js";
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

async function maybeInferBookMetadata(
  book: LoadedBook,
  options: ExtractSkillOptions,
  model: AnyModel,
): Promise<LoadedBook> {
  if (options.titleOverride && options.authorOverride) {
    return book;
  }

  const openingExcerpt = buildMetadataInferenceExcerpt(book.text);
  if (!openingExcerpt) {
    return book;
  }

  console.log("Inferring title and author from the opening text...");
  const inferredMetadata = await inferBookMetadataWithAgent({
    model,
    thinkingLevel: options.thinkingLevel,
    book,
    openingExcerpt,
  });
  const enrichedBook = applyInferredBookMetadata(book, inferredMetadata, {
    titleOverride: options.titleOverride,
    authorOverride: options.authorOverride,
  });
  const metadataChanges: string[] = [];

  if (enrichedBook.title !== book.title) {
    metadataChanges.push(`title "${enrichedBook.title}"`);
  }

  if (enrichedBook.author !== book.author) {
    metadataChanges.push(`author "${enrichedBook.author ?? "Unknown"}"`);
  }

  if (metadataChanges.length > 0) {
    console.log(`Opening-text metadata inference selected ${metadataChanges.join(" and ")}.`);
  } else {
    console.log("Opening-text metadata inference kept the detected title and author.");
  }

  return enrichedBook;
}

export async function extractSkillFromBook(options: ExtractSkillOptions): Promise<GeneratedSkill> {
  warnIfCredentialsAreMissing(options.provider);

  const model = resolveModel(options.provider, options.modelId);
  const outputRoot = resolve(options.outputRoot);
  let book = await loadBook(options.inputPath, {
    titleOverride: options.titleOverride,
    authorOverride: options.authorOverride,
    logger: (message) => console.log(message),
  });
  book = await maybeInferBookMetadata(book, options, model);
  const allChunks = chunkText(book.text, options.chunkSize, options.overlap);
  const chunks =
    options.maxChunks && options.maxChunks > 0 ? allChunks.slice(0, options.maxChunks) : allChunks;

  console.log(
    formatBookLoadSummary(book, {
      totalChunks: allChunks.length,
      processedChunks: chunks.length,
      chunkSize: options.chunkSize,
      overlap: options.overlap,
    }),
  );

  const existingSkills = await loadExistingSkills(outputRoot);

  if (existingSkills.length > 0) {
    console.log(`Loaded ${existingSkills.length} existing skill(s) for overlap checks.`);
  }

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

  console.log("Synthesizing candidate skill family...");
  const candidateBlueprint = await synthesizeSkillCandidateWithAgent({
    model,
    thinkingLevel: options.thinkingLevel,
    book,
    chunkAnalyses,
  });
  const overlapReview =
    existingSkills.length > 0
      ? await (async () => {
          console.log("Reviewing candidate skill overlap...");
          return reviewSkillOverlapWithAgent({
            model,
            thinkingLevel: options.thinkingLevel,
            book,
            candidateBlueprint,
            existingSkills,
          });
        })()
      : {
          summary: "No existing skills were available, so no external overlap review was needed.",
          decisions: [candidateBlueprint, ...candidateBlueprint.subskills].map((skill) => ({
            candidateSlug: skill.slug,
            outcome: "keep" as const,
            rationale: "No existing skills were available for overlap comparison.",
          })),
        };
  const referencedExistingSkills = selectExistingSkillsForFinalization(overlapReview, existingSkills);

  console.log("Finalizing skill family...");
  const blueprint = await finalizeSkillWithAgent({
    model,
    thinkingLevel: options.thinkingLevel,
    book,
    chunkAnalyses,
    candidateBlueprint,
    overlapReview,
    referencedExistingSkills,
  });
  const reusedSkillSlugs = [...new Set([blueprint.slug, ...blueprint.subskills.map((subskill) => subskill.slug)])].filter(
    (slug) => existingSkills.some((skill) => skill.slug === slug),
  );
  if (reusedSkillSlugs.length > 0) {
    console.log(`Extending existing skill(s): ${reusedSkillSlugs.join(", ")}`);
  }

  const enrichedBlueprint = enrichSkillFamily(book, blueprint, existingSkills);

  const markdown = renderSkillMarkdown(enrichedBlueprint);
  const outputDirectory = resolve(outputRoot, enrichedBlueprint.slug);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(join(outputDirectory, "SKILL.md"), markdown, "utf8");

  const subskills: GeneratedSubskill[] = [];

  for (const subskillBlueprint of enrichedBlueprint.subskills) {
    const subskillMarkdown = renderSkillMarkdown(subskillBlueprint);
    const subskillOutputDirectory = resolve(outputRoot, subskillBlueprint.slug);

    await mkdir(subskillOutputDirectory, { recursive: true });
    await writeFile(join(subskillOutputDirectory, "SKILL.md"), subskillMarkdown, "utf8");

    subskills.push({
      outputDirectory: subskillOutputDirectory,
      blueprint: subskillBlueprint,
      markdown: subskillMarkdown,
    });
  }

  await updateReadmeOverview(book, [
    {
      slug: enrichedBlueprint.slug,
      skillTitle: enrichedBlueprint.skillTitle,
      outputDirectory,
    },
    ...subskills.map((subskill) => ({
      slug: subskill.blueprint.slug,
      skillTitle: subskill.blueprint.skillTitle,
      outputDirectory: subskill.outputDirectory,
    })),
  ]);

  return {
    metadata: {
      title: book.title,
      author: book.author,
      sourcePath: book.sourcePath,
      format: book.format,
    },
    chunkCount: chunks.length,
    outputDirectory,
    blueprint: enrichedBlueprint,
    markdown,
    subskills,
  };
}
