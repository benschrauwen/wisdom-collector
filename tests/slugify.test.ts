import { describe, expect, it } from "vitest";

import { slugify } from "../src/utils/slugify.js";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips diacritics via NFKD", () => {
    expect(slugify("Café résumé")).toBe("cafe-resume");
  });

  it("collapses repeated separators", () => {
    expect(slugify("a---b__c")).toBe("a-b-c");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --foo--  ")).toBe("foo");
  });
});
