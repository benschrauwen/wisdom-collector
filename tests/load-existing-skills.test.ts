import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadExistingSkills } from "../src/pipeline/load-existing-skills.js";

const tempDirectories: string[] = [];

async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "wisdom-collector-"));
  tempDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("loadExistingSkills", () => {
  it("returns an empty array when the output root does not exist", async () => {
    const missingDirectory = join(tmpdir(), `wisdom-collector-missing-${Date.now()}`);

    await expect(loadExistingSkills(missingDirectory)).resolves.toEqual([]);
  });

  it("loads existing skills and parses their recorded sources", async () => {
    const outputRoot = await createTempDirectory();
    const negotiationSkillDirectory = join(outputRoot, "negotiation-framing");
    const coachingSkillDirectory = join(outputRoot, "coaching-mode");

    await mkdir(negotiationSkillDirectory, { recursive: true });
    await mkdir(coachingSkillDirectory, { recursive: true });

    await writeFile(
      join(negotiationSkillDirectory, "SKILL.md"),
      [
        "---",
        "name: negotiation-framing",
        "description: >-",
        "  Helps frame hard negotiations.",
        "---",
        "# Negotiation Framing",
        "",
        "Use principled framing before debating positions.",
        "",
        "## Source note",
        "Synthesized from:",
        "- *Getting to Yes* by Roger Fisher and William Ury.",
        "- *Difficult Conversations* by Douglas Stone.",
      ].join("\n"),
      "utf8",
    );

    await writeFile(
      join(coachingSkillDirectory, "SKILL.md"),
      ["# Coaching Mode", "", "Help someone think clearly before proposing action."].join("\n"),
      "utf8",
    );

    const existingSkills = await loadExistingSkills(outputRoot);

    expect(existingSkills).toHaveLength(2);
    expect(existingSkills[0]).toMatchObject({
      slug: "coaching-mode",
      skillTitle: "Coaching Mode",
      description: "",
      sourceMentions: [],
    });
    expect(existingSkills[1]).toMatchObject({
      slug: "negotiation-framing",
      skillTitle: "Negotiation Framing",
      description: "Helps frame hard negotiations.",
      sourceMentions: [
        {
          title: "Getting to Yes",
          author: "Roger Fisher and William Ury",
        },
        {
          title: "Difficult Conversations",
          author: "Douglas Stone",
        },
      ],
    });
  });
});
