#!/usr/bin/env node
import { basename } from "node:path";
import { buildPlan } from "./pipeline.ts";
import { loadPrompt } from "./prompts.ts";

function parseRunArgs(args: string[]): { inputPath: string; skillName: string; domain: string } {
  const out: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const value = args[i + 1];
    if (key?.startsWith("--") && value && !value.startsWith("--")) {
      out[key.slice(2)] = value;
      i += 1;
    }
  }

  if (!out.input || !out["skill-name"] || !out.domain) {
    throw new Error("Usage: pi-mono run --input <book.pdf|book.md|book.txt> --skill-name <name> --domain <domain>");
  }

  return { inputPath: out.input, skillName: out["skill-name"], domain: out.domain };
}

function main(): void {
  const [, , command, ...args] = process.argv;

  if (command !== "run") {
    throw new Error("Only `run` is currently supported. Example: pi-mono run --input ./book.pdf --skill-name demo --domain business");
  }

  const config = parseRunArgs(args);
  const plan = buildPlan(config);

  console.log(JSON.stringify(plan, null, 2));
  console.log("\n--- rendered prompts ---");

  for (const step of plan) {
    const promptName = basename(step.prompt);
    console.log(`\n## ${step.stage} :: ${promptName}`);
    console.log(
      loadPrompt(promptName, {
        INPUT_PATH: config.inputPath,
        SKILL_NAME: config.skillName,
        DOMAIN: config.domain
      })
    );
  }
}

main();
