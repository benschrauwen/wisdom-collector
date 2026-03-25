import type { BookMetadata, ExistingSkill, SkillBlueprint, SkillFileBlueprint, SkillSource } from "../types.js";

const SOURCE_SECTION_RE = /^##\s+Source(?:\s+note)?\b/im;
const SOURCE_SECTION_BLOCK_RE = /^##\s+Source(?:\s+note)?\b[\s\S]*?(?=^##\s+|(?![\s\S]))/im;
const RELATED_SECTION_RE = /^##\s+Related skills\b/im;

function appendSection(markdown: string, section: string): string {
  const trimmedMarkdown = markdown.trim();
  const trimmedSection = section.trim();

  if (!trimmedMarkdown) {
    return trimmedSection;
  }

  return `${trimmedMarkdown}\n\n${trimmedSection}`;
}

function normalizeSourceValue(value: string): string {
  return value.replace(/\s+/g, " ").replace(/[.]+$/, "").trim();
}

function toBookSource(book: BookMetadata): SkillSource {
  return book.author
    ? {
        title: book.title,
        author: book.author,
      }
    : {
        title: book.title,
      };
}

function dedupeSources(sources: SkillSource[]): SkillSource[] {
  const deduped: SkillSource[] = [];

  for (const source of sources) {
    const normalizedTitle = normalizeSourceValue(source.title);
    const normalizedAuthor = source.author ? normalizeSourceValue(source.author) : undefined;

    if (!normalizedTitle) {
      continue;
    }

    const existingIndex = deduped.findIndex((candidate) => {
      if (candidate.title !== normalizedTitle) {
        return false;
      }

      if (!candidate.author || !normalizedAuthor) {
        return true;
      }

      return candidate.author === normalizedAuthor;
    });

    if (existingIndex === -1) {
      deduped.push(
        normalizedAuthor
          ? {
              title: normalizedTitle,
              author: normalizedAuthor,
            }
          : {
              title: normalizedTitle,
            },
      );
      continue;
    }

    if (!deduped[existingIndex]?.author && normalizedAuthor) {
      deduped[existingIndex] = {
        title: normalizedTitle,
        author: normalizedAuthor,
      };
    }
  }

  return deduped;
}

function formatSourceMention(source: SkillSource): string {
  return source.author ? `*${source.title}* by ${source.author}.` : `*${source.title}*.`;
}

function buildSourceNote(sources: SkillSource[]): string {
  const dedupedSources = dedupeSources(sources);
  if (dedupedSources.length === 0) {
    return "";
  }

  if (dedupedSources.length === 1) {
    return ["## Source note", `Extracted from ${formatSourceMention(dedupedSources[0])}`].join("\n");
  }

  return ["## Source note", "Synthesized from:", ...dedupedSources.map((source) => `- ${formatSourceMention(source)}`)].join(
    "\n",
  );
}

function replaceSourceSection(skillBody: string, sourceSection: string): string {
  const existingSourceSection = skillBody.match(SOURCE_SECTION_BLOCK_RE);
  if (!existingSourceSection || existingSourceSection.index === undefined) {
    return appendSection(skillBody, sourceSection);
  }

  const withoutSourceSection = [
    skillBody.slice(0, existingSourceSection.index).trimEnd(),
    skillBody.slice(existingSourceSection.index + existingSourceSection[0].length).trimStart(),
  ]
    .filter(Boolean)
    .join("\n\n");

  return appendSection(withoutSourceSection, sourceSection);
}

function isInlineSourceLine(line: string): boolean {
  const normalized = line.replace(/^[*_`\s]+|[*_`\s]+$/g, "").trim();
  return /^source\s*:/i.test(normalized) || /^extract(?:ed|ion)\s+from\b/i.test(normalized);
}

function stripLeadingInlineSourcePreamble(skillBody: string): string {
  const lines = skillBody.replace(/\r\n/g, "\n").split("\n");
  let cursor = 0;

  while (cursor < lines.length && !lines[cursor]?.trim()) {
    cursor += 1;
  }

  if (cursor < lines.length && /^#\s+/.test(lines[cursor] ?? "")) {
    cursor += 1;
  }

  while (cursor < lines.length && !lines[cursor]?.trim()) {
    cursor += 1;
  }

  if (cursor >= lines.length || !isInlineSourceLine(lines[cursor] ?? "")) {
    return skillBody.trim();
  }

  lines.splice(cursor, 1);

  while (cursor < lines.length && !lines[cursor]?.trim()) {
    lines.splice(cursor, 1);
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildRelatedSkillsSection(currentSkill: SkillFileBlueprint, allSkills: SkillFileBlueprint[]): string {
  const relatedSkills = allSkills.filter((skill) => skill.slug !== currentSkill.slug);

  if (relatedSkills.length === 0) {
    return "";
  }

  return [
    "## Related skills",
    ...relatedSkills.map(
      (skill) => `- [${skill.skillTitle}](../${skill.slug}/SKILL.md): ${skill.description}`,
    ),
  ].join("\n");
}

function enrichSkillBody(
  book: BookMetadata,
  currentSkill: SkillFileBlueprint,
  allSkills: SkillFileBlueprint[],
  existingSkill?: ExistingSkill,
): string {
  let skillBody = stripLeadingInlineSourcePreamble(currentSkill.skillBody);

  if (!RELATED_SECTION_RE.test(skillBody)) {
    const relatedSkillsSection = buildRelatedSkillsSection(currentSkill, allSkills);

    if (relatedSkillsSection) {
      skillBody = appendSection(skillBody, relatedSkillsSection);
    }
  }

  const sourceSection = buildSourceNote([...(existingSkill?.sourceMentions ?? []), toBookSource(book)]);
  if (!SOURCE_SECTION_RE.test(skillBody)) {
    skillBody = appendSection(skillBody, sourceSection);
  } else {
    skillBody = replaceSourceSection(skillBody, sourceSection);
  }

  return skillBody;
}

function enrichSkillFile(
  book: BookMetadata,
  currentSkill: SkillFileBlueprint,
  allSkills: SkillFileBlueprint[],
  existingSkill?: ExistingSkill,
): SkillFileBlueprint {
  return {
    ...currentSkill,
    skillBody: enrichSkillBody(book, currentSkill, allSkills, existingSkill),
  };
}

export function enrichSkillFamily(
  book: BookMetadata,
  blueprint: SkillBlueprint,
  existingSkills: ExistingSkill[] = [],
): SkillBlueprint {
  const allSkills = [blueprint, ...blueprint.subskills];
  const existingSkillMap = new Map(existingSkills.map((skill) => [skill.slug, skill]));

  return {
    ...enrichSkillFile(book, blueprint, allSkills, existingSkillMap.get(blueprint.slug)),
    subskills: blueprint.subskills.map((subskill) =>
      enrichSkillFile(book, subskill, allSkills, existingSkillMap.get(subskill.slug)),
    ),
  };
}
