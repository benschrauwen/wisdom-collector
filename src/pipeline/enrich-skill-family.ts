import type { BookMetadata, SkillBlueprint, SkillFileBlueprint } from "../types.js";

const SOURCE_SECTION_RE = /^##\s+Source(?:\s+note)?\b/im;
const RELATED_SECTION_RE = /^##\s+Related skills\b/im;

function appendSection(markdown: string, section: string): string {
  return `${markdown.trim()}\n\n${section.trim()}`;
}

function buildSourceNote(book: BookMetadata): string {
  const sourceLine = book.author
    ? `Extracted from *${book.title}* by ${book.author}.`
    : `Extracted from *${book.title}*.`;

  return ["## Source note", sourceLine].join("\n");
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
): string {
  let skillBody = currentSkill.skillBody.trim();

  if (!RELATED_SECTION_RE.test(skillBody)) {
    const relatedSkillsSection = buildRelatedSkillsSection(currentSkill, allSkills);

    if (relatedSkillsSection) {
      skillBody = appendSection(skillBody, relatedSkillsSection);
    }
  }

  if (!SOURCE_SECTION_RE.test(skillBody)) {
    skillBody = appendSection(skillBody, buildSourceNote(book));
  }

  return skillBody;
}

function enrichSkillFile(
  book: BookMetadata,
  currentSkill: SkillFileBlueprint,
  allSkills: SkillFileBlueprint[],
): SkillFileBlueprint {
  return {
    ...currentSkill,
    skillBody: enrichSkillBody(book, currentSkill, allSkills),
  };
}

export function enrichSkillFamily(book: BookMetadata, blueprint: SkillBlueprint): SkillBlueprint {
  const allSkills = [blueprint, ...blueprint.subskills];

  return {
    ...enrichSkillFile(book, blueprint, allSkills),
    subskills: blueprint.subskills.map((subskill) => enrichSkillFile(book, subskill, allSkills)),
  };
}
