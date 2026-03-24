import test from "node:test";
import assert from "node:assert/strict";
import { buildPlan } from "../src/pipeline.ts";

test("buildPlan returns canonical five stages", () => {
  const plan = buildPlan({ inputPath: "book.pdf", skillName: "test-skill", domain: "general" });

  assert.equal(plan.length, 5);
  assert.equal(plan[0]?.stage, "normalize");
  assert.equal(plan[4]?.stage, "evaluate");
});
