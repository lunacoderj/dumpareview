import { describe, it, expect } from "vitest";
import { generate100Reviews } from "@/lib/geminiReviews";

describe("AI 100-Review Generation Engine", () => {
  it("should generate exactly 100 unique natural reviews for a restaurant", async () => {
    const reviews = await generate100Reviews({
      businessName: "Luigi Pizzeria",
      category: "restaurant",
    });

    expect(reviews).toBeDefined();
    expect(reviews.length).toBe(100);

    // Verify all are non-empty strings
    for (const r of reviews) {
      expect(typeof r).toBe("string");
      expect(r.trim().length).toBeGreaterThan(15);
      expect(r).toContain("Luigi Pizzeria");
    }

    // Verify uniqueness
    const unique = new Set(reviews);
    expect(unique.size).toBe(100);
  });

  it("should generate 100 reviews tailored to a medical clinic", async () => {
    const reviews = await generate100Reviews({
      businessName: "Smile Dental Clinic",
      category: "dental",
    });

    expect(reviews.length).toBe(100);
    const unique = new Set(reviews);
    expect(unique.size).toBe(100);
  });
});

