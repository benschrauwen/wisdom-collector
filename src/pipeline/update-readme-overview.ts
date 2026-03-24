import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import type { BookMetadata } from "../types.js";
import { slugify } from "../utils/slugify.js";

const README_PATH = fileURLToPath(new URL("../../README.md", import.meta.url));
const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const OVERVIEW_HEADING = "## Extracted books";
const SECTION_START = "<!-- extracted-books:start -->";
const SECTION_END = "<!-- extracted-books:end -->";

interface ReadmeOverviewSkill {
  slug: string;
  skillTitle: string;
  outputDirectory: string;
}

function buildBookEntryId(book: BookMetadata): string {
  const sourceLabel = book.author ? `${book.title}-${book.author}` : book.title;
  return slugify(sourceLabel) || "untitled-book";
}

function buildSkillLink(skill: ReadmeOverviewSkill): string {
  const skillFilePath = join(skill.outputDirectory, "SKILL.md");
  const readmeRelativePath = relative(PROJECT_ROOT, skillFilePath).replace(/\\/g, "/");
  const canLinkToSkill = !readmeRelativePath.startsWith("..") && !isAbsolute(readmeRelativePath);

  if (!canLinkToSkill) {
    return `- ${skill.skillTitle} (\`${skill.slug}\`)`;
  }

  return `- [${skill.skillTitle}](${readmeRelativePath})`;
}

function buildBookBlock(book: BookMetadata, skills: ReadmeOverviewSkill[]): string {
  const entryId = buildBookEntryId(book);

  return [
    `<!-- extracted-book:${entryId} -->`,
    `### ${book.title}`,
    ...(book.author ? [`Author: ${book.author}`] : []),
    "",
    "Extracted skills:",
    ...skills.map(buildSkillLink),
    `<!-- /extracted-book:${entryId} -->`,
  ].join("\n");
}

function upsertBookBlock(sectionContent: string, book: BookMetadata, skills: ReadmeOverviewSkill[]): string {
  const entryId = buildBookEntryId(book);
  const bookBlock = buildBookBlock(book, skills);
  const startMarker = `<!-- extracted-book:${entryId} -->`;
  const endMarker = `<!-- /extracted-book:${entryId} -->`;
  const blockPattern = new RegExp(
    `${startMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "m",
  );

  if (!sectionContent.trim()) {
    return bookBlock;
  }

  if (blockPattern.test(sectionContent)) {
    return sectionContent.replace(blockPattern, bookBlock).trim();
  }

  return `${sectionContent.trim()}\n\n${bookBlock}`;
}

export async function updateReadmeOverview(book: BookMetadata, skills: ReadmeOverviewSkill[]): Promise<void> {
  const readme = await readFile(README_PATH, "utf8");

  if (!readme.includes(SECTION_START) || !readme.includes(SECTION_END)) {
    const nextReadme = `${readme.trimEnd()}\n\n${OVERVIEW_HEADING}\n${SECTION_START}\n\n${buildBookBlock(book, skills)}\n\n${SECTION_END}\n`;
    await writeFile(README_PATH, nextReadme, "utf8");
    return;
  }

  const sectionStartIndex = readme.indexOf(SECTION_START);
  const sectionEndIndex = readme.indexOf(SECTION_END, sectionStartIndex);

  if (sectionStartIndex === -1 || sectionEndIndex === -1) {
    return;
  }

  const sectionContentStart = sectionStartIndex + SECTION_START.length;
  const beforeSection = readme.slice(0, sectionContentStart).trimEnd();
  const sectionContent = readme.slice(sectionContentStart, sectionEndIndex).trim();
  const afterSection = readme.slice(sectionEndIndex).trimStart();
  const nextSectionContent = upsertBookBlock(sectionContent, book, skills);
  const nextReadme = `${beforeSection}\n\n${nextSectionContent}\n\n${afterSection}\n`;

  await writeFile(README_PATH, nextReadme, "utf8");
}
