import type { SkillBlueprint } from "../types.js";

function renderBullets(title: string, items: string[]): string {
  if (items.length === 0) {
    return "";
  }

  const body = items.map((item) => `- ${item}`).join("\n");
  return `## ${title}\n${body}`;
}

function renderNumbered(title: string, items: string[]): string {
  if (items.length === 0) {
    return "";
  }

  const body = items.map((item, index) => `${index + 1}. ${item}`).join("\n");
  return `## ${title}\n${body}`;
}

function renderFrontmatter(blueprint: SkillBlueprint): string {
  return [
    "---",
    `name: ${blueprint.slug}`,
    "description: >-",
    `  ${blueprint.description}`,
    "---",
  ].join("\n");
}

export function renderSkillMarkdown(blueprint: SkillBlueprint): string {
  return [
    renderFrontmatter(blueprint),
    "",
    `# ${blueprint.skillTitle}`,
    "",
    blueprint.summary,
    "",
    renderBullets("When To Use", blueprint.whenToUse),
    "",
    renderBullets("Required Inputs", blueprint.requiredInputs),
    "",
    renderNumbered("Workflow", blueprint.workflow),
    "",
    renderBullets("Heuristics", blueprint.heuristics),
    "",
    renderBullets("Anti-Patterns", blueprint.antiPatterns),
    "",
    renderBullets("Starter Prompts", blueprint.starterPrompts),
    "",
    renderBullets("Source Notes", blueprint.sourceNotes),
  ]
    .filter(Boolean)
    .join("\n");
}
