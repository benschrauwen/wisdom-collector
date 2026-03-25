import { describe, expect, it } from "vitest";

import { diagnosePdfTextForOcr } from "../src/loaders/pdf-extraction.js";

describe("diagnosePdfTextForOcr", () => {
  it("requests OCR when extracted text is empty", () => {
    expect(diagnosePdfTextForOcr("   \n", 120, 2_000_000)).toEqual({
      shouldUseOcr: true,
      reason: "Direct PDF text extraction returned no usable text.",
    });
  });

  it("requests OCR when text is too sparse for the reported page count", () => {
    const text = "1\n\n2\n\n3\n\n4";
    const diagnostic = diagnosePdfTextForOcr(text, 40, 3_500_000);

    expect(diagnostic.shouldUseOcr).toBe(true);
    expect(diagnostic.reason).toMatch(/sparse/i);
    expect(diagnostic.reason).toMatch(/40 pages/i);
  });

  it("does not request OCR for a healthy text layer", () => {
    const text = Array.from({ length: 12 }, (_, index) => `Page ${index + 1}\n${"word ".repeat(220)}`).join("\n\n");

    expect(diagnosePdfTextForOcr(text, 12, 1_500_000)).toEqual({
      shouldUseOcr: false,
    });
  });
});
