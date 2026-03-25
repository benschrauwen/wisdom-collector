import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import type { ExistingSkill, SkillSource } from "../types.js";

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;
const TITLE_RE = /^#\s+(.+)$/m;
const SOURCE_SECTION_RE = /^##\s+Source(?:\s+note)?\b\s*\n([\s\S]*?)(?=^##\s+|(?![\s\S]))/im;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function splitFrontmatter(markdown: string): { frontmatter: string; skillBody: string } {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const match = normalized.match(FRONTMATTER_RE);

  if (!match) {
    return {
      frontmatter: "",
      skillBody: normalized,
    };
  }

  return {
    frontmatter: match[1].trim(),
    skillBody: match[2].trim(),
  };
}

function parseFrontmatter(frontmatter: string): { slug?: string; description?: string } {
  const lines = frontmatter.split("\n");
  let slug: string | undefined;
  let description: string | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trimEnd() ?? "";

    if (line.startsWith("name:")) {
      slug = line.slice("name:".length).trim();
      continue;
    }

    if (!line.startsWith("description:")) {
      continue;
    }

    const rawValue = line.slice("description:".length).trim();
    if (rawValue && !rawValue.startsWith(">") && !rawValue.startsWith("|")) {
      description = rawValue.replace(/^["']|["']$/g, "").trim();
      continue;
    }

    const descriptionLines: string[] = [];
    while (index + 1 < lines.length) {
      const nextLine = lines[index + 1] ?? "";
      if (nextLine.length > 0 && !/^\s/.test(nextLine)) {
        break;
      }

      index += 1;
      descriptionLines.push(nextLine.replace(/^\s{2}/, ""));
    }

    description = descriptionLines.join("\n").trim();
  }

  return { slug, description };
}

function resolveSkillTitle(skillBody: string, fallbackSlug: string): string {
  const heading = skillBody.match(TITLE_RE)?.[1]?.trim();
  return heading || humanizeSlug(fallbackSlug) || "Untitled Skill";
}

function upsertSource(sources: SkillSource[], candidate: SkillSource): void {
  const title = normalizeWhitespace(candidate.title);
  const author = candidate.author ? normalizeWhitespace(candidate.author.replace(/[.]+$/, "")) : undefined;

  if (!title) {
    return;
  }

  const existingIndex = sources.findIndex((source) => {
    if (source.title.localeCompare(title, undefined, { sensitivity: "accent" }) !== 0) {
      return false;
    }

    if (!source.author || !author) {
      return true;
    }

    return source.author.localeCompare(author, undefined, { sensitivity: "accent" }) === 0;
  });

  if (existingIndex === -1) {
    sources.push(author ? { title, author } : { title });
    return;
  }

  if (!sources[existingIndex]?.author && author) {
    sources[existingIndex] = { title, author };
  }
}

function extractSourceMentions(skillBody: string): SkillSource[] {
  const sourceSection = skillBody.match(SOURCE_SECTION_RE)?.[1] ?? "";
  if (!sourceSection.trim()) {
    return [];
  }

  const sources: SkillSource[] = [];
  const lines = sourceSection
    .split("\n")
    .map((line) => line.replace(/^\s*-\s*/, "").trim())
    .filter(Boolean);

  for (const line of lines) {
    const authorPossessiveMatch = line.match(/^(.+?)'s\s+\*([^*]+)\*/i);
    if (authorPossessiveMatch) {
      upsertSource(sources, {
        author: authorPossessiveMatch[1],
        title: authorPossessiveMatch[2],
      });
    }

    const sourceMatch = line.match(/\*([^*]+)\*(?:\s+by\s+([^.\n]+))?/i);
    if (sourceMatch) {
      upsertSource(sources, {
        title: sourceMatch[1],
        author: sourceMatch[2],
      });
    }
  }

  return sources;
}

async function listSkillFiles(rootDirectory: string): Promise<string[]> {
  let entries;

  try {
    entries = await readdir(rootDirectory, { withFileTypes: true });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string" &&
      error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }

  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = join(rootDirectory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listSkillFiles(absolutePath)));
      continue;
    }

    if (entry.isFile() && entry.name === "SKILL.md") {
      files.push(absolutePath);
    }
  }

  return files;
}

async function loadExistingSkill(filePath: string): Promise<ExistingSkill> {
  const markdown = await readFile(filePath, "utf8");
  const { frontmatter, skillBody } = splitFrontmatter(markdown);
  const { slug: frontmatterSlug, description } = parseFrontmatter(frontmatter);
  const fallbackSlug = basename(dirname(filePath));
  const slug = frontmatterSlug || fallbackSlug;

  return {
    filePath,
    slug,
    skillTitle: resolveSkillTitle(skillBody, slug),
    description: normalizeWhitespace(description ?? ""),
    skillBody,
    sourceMentions: extractSourceMentions(skillBody),
  };
}

export async function loadExistingSkills(rootDirectory: string): Promise<ExistingSkill[]> {
  const skillFiles = await listSkillFiles(rootDirectory);
  const existingSkills = await Promise.all(skillFiles.map((filePath) => loadExistingSkill(filePath)));

  return existingSkills.sort((left, right) => left.slug.localeCompare(right.slug));
}
