import type { SkillFileBlueprint } from "../types.js";

function renderFrontmatter(blueprint: Pick<SkillFileBlueprint, "slug" | "description">): string {
  return [
    "---",
    `name: ${blueprint.slug}`,
    "description: >-",
    `  ${blueprint.description}`,
    "---",
  ].join("\n");
}

export function renderSkillMarkdown(blueprint: Pick<SkillFileBlueprint, "slug" | "description" | "skillBody">): string {
  return [renderFrontmatter(blueprint), "", blueprint.skillBody.trim()].join("\n");
}
