import { describe, expect, it } from "vitest";

import { renderSkillMarkdown } from "../src/renderers/render-skill-markdown.js";
import type { SkillBlueprint } from "../src/types.js";

function minimalBlueprint(overrides: Partial<SkillBlueprint> = {}): SkillBlueprint {
  return {
    slug: "test-skill",
    skillTitle: "Test Skill",
    description: "A short description.",
    summary: "Summary paragraph.",
    whenToUse: ["When A"],
    requiredInputs: ["Input 1"],
    workflow: ["Step one", "Step two"],
    heuristics: ["H1"],
    antiPatterns: ["Avoid X"],
    starterPrompts: ["Prompt 1"],
    sourceNotes: ["Note 1"],
    ...overrides,
  };
}

describe("renderSkillMarkdown", () => {
  it("renders frontmatter and numbered workflow", () => {
    const md = renderSkillMarkdown(minimalBlueprint());
    expect(md).toContain("---\n");
    expect(md).toContain("name: test-skill");
    expect(md).toContain("description: >-");
    expect(md).toContain("# Test Skill");
    expect(md).toContain("## Workflow");
    expect(md).toContain("1. Step one");
    expect(md).toContain("2. Step two");
  });

  it("omits bullet sections when arrays are empty", () => {
    const md = renderSkillMarkdown(
      minimalBlueprint({
        whenToUse: [],
        requiredInputs: [],
        workflow: [],
        heuristics: [],
        antiPatterns: [],
        starterPrompts: [],
        sourceNotes: [],
      }),
    );
    expect(md).not.toContain("## When To Use");
    expect(md).not.toContain("## Workflow");
  });
});
