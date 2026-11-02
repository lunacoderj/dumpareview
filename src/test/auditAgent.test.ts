import { describe, it, expect } from "vitest";
import { normalizeText, computeSimilarity } from "@/lib/auditAgent";

describe("Audit Agent Matching & Normalization Engine", () => {
  it("should normalize review text by stripping punctuation, capitalization, and whitespace", () => {
    const raw = "  Amazing food!! The pasta was 10/10, definitely coming back.  ";
    const normalized = normalizeText(raw);
    expect(normalized).toBe("amazing food the pasta was 1010 definitely coming back");
  });

  it("should compute 1.0 similarity for identical text", () => {
    const str1 = "Great service and very friendly staff!";
    const str2 = "Great service and very friendly staff!";
    expect(computeSimilarity(str1, str2)).toBe(1.0);
  });

  it("should detect high similarity (>0.85) when customer tweaks punctuation or casing", () => {
    const original = "Fast turnaround, honest pricing, and great communication!";
    const onGoogle = "Fast turnaround honest pricing and great communication";
    const score = computeSimilarity(original, onGoogle);
    expect(score).toBeGreaterThanOrEqual(0.9);
  });

  it("should return low similarity for completely unrelated reviews", () => {
    const original = "Delicious pizza and cozy atmosphere.";
    const onGoogle = "Terrible experience, waited 40 minutes for water.";
    const score = computeSimilarity(original, onGoogle);
    expect(score).toBeLessThan(0.3);
  });
});

