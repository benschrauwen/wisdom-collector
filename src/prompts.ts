import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROMPT_DIR = resolve(HERE, "../prompts");

export function loadPrompt(filename: string, vars: Record<string, string>): string {
  const template = readFileSync(resolve(PROMPT_DIR, filename), "utf8");
  return template.replace(/\{([A-Z_]+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}
