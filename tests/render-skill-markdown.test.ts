import { describe, expect, it } from "vitest";

import { renderSkillMarkdown } from "../src/renderers/render-skill-markdown.js";
import type { SkillBlueprint } from "../src/types.js";

function minimalBlueprint(overrides: Partial<SkillBlueprint> = {}): SkillBlueprint {
  return {
    slug: "test-skill",
    skillTitle: "Test Skill",
    description: "A short description.",
    skillBody: "# Test Skill\n\nUse this skill when the situation needs a calm, structured response.",
    subskills: [],
    ...overrides,
  };
}

describe("renderSkillMarkdown", () => {
  it("renders frontmatter and preserves the authored body", () => {
    const md = renderSkillMarkdown(minimalBlueprint());
    expect(md).toContain("---\n");
    expect(md).toContain("name: test-skill");
    expect(md).toContain("description: >-");
    expect(md).toContain("# Test Skill");
    expect(md).toContain("Use this skill when the situation needs a calm, structured response.");
  });

  it("supports flexible markdown structures such as subskills", () => {
    const md = renderSkillMarkdown(
      minimalBlueprint({
        skillBody: [
          "# Test Skill",
          "",
          "## Choose a mode",
          "- Use the main flow for team alignment.",
          "- Use the coaching mode for one-on-one support.",
          "",
          "## Subskills",
          "### Coaching mode",
          "Help a manager diagnose resistance and respond with curiosity.",
        ].join("\n"),
      }),
    );
    expect(md).toContain("## Choose a mode");
    expect(md).toContain("## Subskills");
    expect(md).toContain("### Coaching mode");
  });
});
