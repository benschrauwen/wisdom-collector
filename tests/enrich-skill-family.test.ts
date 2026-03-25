import { describe, expect, it } from "vitest";

import { enrichSkillFamily } from "../src/pipeline/enrich-skill-family.js";
import type { BookMetadata, ExistingSkill, SkillBlueprint } from "../src/types.js";

const book: BookMetadata = {
  title: "High Output Management",
  author: "Andy Grove",
  sourcePath: "/tmp/high-output-management.pdf",
  format: "pdf",
};

function makeBlueprint(): SkillBlueprint {
  return {
    slug: "high-leverage-management",
    skillTitle: "High-Leverage Management",
    description: "Umbrella skill for managerial leverage and output.",
    skillBody: [
      "# High-Leverage Management",
      "",
      "*Source: Andy Grove,* High Output Management",
      "",
      "Use this as the umbrella skill when the management problem spans multiple domains.",
    ].join("\n"),
    subskills: [
      {
        slug: "managerial-time-and-meeting-control",
        skillTitle: "Managerial Time and Meeting Control",
        description: "Time allocation, delegation, interruptions, and meetings.",
        skillBody: "# Managerial Time and Meeting Control\n\nControl the manager's time budget.",
      },
      {
        slug: "performance-feedback-and-talent-decisions",
        skillTitle: "Performance Feedback and Talent Decisions",
        description: "Reviews, hiring, retention, compensation, and promotion.",
        skillBody: "# Performance Feedback and Talent Decisions\n\nUse evidence in talent decisions.",
      },
    ],
  };
}

describe("enrichSkillFamily", () => {
  it("adds related skill links to each generated skill", () => {
    const enriched = enrichSkillFamily(book, makeBlueprint());

    expect(enriched.skillBody).toContain("## Related skills");
    expect(enriched.skillBody).toContain(
      "[Managerial Time and Meeting Control](../managerial-time-and-meeting-control/SKILL.md)",
    );

    expect(enriched.subskills[0]?.skillBody).toContain("## Related skills");
    expect(enriched.subskills[0]?.skillBody).toContain(
      "[High-Leverage Management](../high-leverage-management/SKILL.md)",
    );
    expect(enriched.subskills[0]?.skillBody).toContain(
      "[Performance Feedback and Talent Decisions](../performance-feedback-and-talent-decisions/SKILL.md)",
    );
  });

  it("normalizes the source section and adds one when missing", () => {
    const enriched = enrichSkillFamily(book, makeBlueprint());

    expect(enriched.skillBody.match(/^##\s+Source note\b/gim)).toHaveLength(1);
    expect(enriched.skillBody).not.toContain("*Source: Andy Grove,* High Output Management");
    expect(enriched.skillBody).toContain("Extracted from *High Output Management* by Andy Grove.");
    expect(enriched.subskills[0]?.skillBody).toContain("## Source note");
    expect(enriched.subskills[0]?.skillBody).toContain("Extracted from *High Output Management* by Andy Grove.");
  });

  it("merges prior source mentions when a skill extends an existing one", () => {
    const existingSkills: ExistingSkill[] = [
      {
        filePath: "/tmp/high-leverage-management/SKILL.md",
        slug: "high-leverage-management",
        skillTitle: "High-Leverage Management",
        description: "Umbrella skill for managerial leverage and output.",
        skillBody: [
          "# High-Leverage Management",
          "",
          "Existing guidance.",
          "",
          "## Source note",
          "Extracted from *The Effective Executive* by Peter Drucker.",
        ].join("\n"),
        sourceMentions: [
          {
            title: "The Effective Executive",
            author: "Peter Drucker",
          },
        ],
      },
    ];

    const enriched = enrichSkillFamily(book, makeBlueprint(), existingSkills);

    expect(enriched.skillBody.match(/^##\s+Source note\b/gim)).toHaveLength(1);
    expect(enriched.skillBody).toContain("Synthesized from:");
    expect(enriched.skillBody).toContain("*The Effective Executive* by Peter Drucker.");
    expect(enriched.skillBody).toContain("*High Output Management* by Andy Grove.");
  });
});
