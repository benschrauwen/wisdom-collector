#!/usr/bin/env node

import "dotenv/config";

import { InvalidArgumentError, Option, Command } from "commander";
import { getModels, getProviders, type KnownProvider, type ThinkingLevel } from "@mariozechner/pi-ai";

import { extractSkillFromBook } from "./pipeline/extract-skill.js";

const providerChoices = getProviders();
const thinkingChoices: ThinkingLevel[] = ["minimal", "low", "medium", "high", "xhigh"];

const preferredModels: Partial<Record<KnownProvider, string>> = {
  openai: "gpt-5.4-mini",
  anthropic: "claude-sonnet-4-6",
  google: "gemini-3-flash",
};

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new InvalidArgumentError(`Expected a positive integer, received "${value}".`);
  }

  return parsed;
}

function resolveDefaultModel(provider: KnownProvider): string {
  const preferred = preferredModels[provider];
  if (preferred) {
    return preferred;
  }

  const firstModel = getModels(provider)[0];
  if (!firstModel) {
    throw new Error(`No models are registered for provider "${provider}".`);
  }

  return firstModel.id;
}

interface CliOptions {
  input: string;
  output: string;
  provider: KnownProvider;
  model?: string;
  thinking: ThinkingLevel;
  chunkSize: number;
  overlap: number;
  maxChunks?: number;
  title?: string;
  author?: string;
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("skill-extractor")
    .description("Extract a reusable AI skill from a book or long-form document.")
    .requiredOption("-i, --input <path>", "Path to the source book file (pdf, md, txt, or text-like file).")
    .option("-o, --output <path>", "Root output directory for generated skills.", "skills")
    .addOption(
      new Option("-p, --provider <provider>", "LLM provider to use.")
        .choices(providerChoices)
        .default("openai"),
    )
    .option("-m, --model <model>", "Model id for the selected provider.")
    .addOption(
      new Option("--thinking <level>", "Agent reasoning level.")
        .choices(thinkingChoices)
        .default("medium"),
    )
    .option("--chunk-size <number>", "Approximate max characters per chunk.", parseInteger, 100_000)
    .option("--overlap <number>", "Approximate overlap characters between chunks.", parseInteger, 1200)
    .option("--max-chunks <number>", "Optional cap for processed chunks.", parseInteger)
    .option("--title <title>", "Override the detected book title.")
    .option("--author <author>", "Override the detected author.")
    .showHelpAfterError();

  await program.parseAsync(process.argv);
  const options = program.opts<CliOptions>();
  const modelId = options.model ?? resolveDefaultModel(options.provider);

  console.log(`Using provider "${options.provider}" with model "${modelId}".`);

  const result = await extractSkillFromBook({
    inputPath: options.input,
    outputRoot: options.output,
    provider: options.provider,
    modelId,
    thinkingLevel: options.thinking,
    chunkSize: options.chunkSize,
    overlap: options.overlap,
    maxChunks: options.maxChunks,
    titleOverride: options.title,
    authorOverride: options.author,
  });

  console.log(`Wrote skill "${result.blueprint.skillTitle}" to ${result.outputDirectory}`);
  if (result.subskills.length > 0) {
    console.log(
      `Wrote ${result.subskills.length} subskill(s): ${result.subskills.map((subskill) => subskill.blueprint.slug).join(", ")}`,
    );
  }
  console.log(`Processed ${result.chunkCount} chunk(s).`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
