import test from "node:test";
import assert from "node:assert/strict";
import { loadPrompt } from "../src/prompts.ts";

test("loadPrompt injects variables", () => {
  const rendered = loadPrompt("04_synthesize_skill.md", {
    INPUT_PATH: "book.pdf",
    SKILL_NAME: "negotiation",
    DOMAIN: "business"
  });

  assert.match(rendered, /skills\/negotiation\/SKILL\.md/);
  assert.match(rendered, /business/);
});
