import { describe, it, expect } from "vitest";
import { feedbackSchema } from "./validation";

describe("feedbackSchema", () => {
  const valid = {
    slug: "joes-salon",
    rating: 5,
    customer_name: "Ali",
    customer_phone: "03001234567",
    comment: "Great service",
    hp: "",
  };

  it("accepts a valid 5★ submission", () => {
    expect(feedbackSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts submission with empty optional fields", () => {
    const r = feedbackSchema.safeParse({ ...valid, customer_phone: "", comment: "" });
    expect(r.success).toBe(true);
  });

  it("rejects rating outside 1-5", () => {
    expect(feedbackSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
  });

  it("rejects non-integer rating", () => {
    expect(feedbackSchema.safeParse({ ...valid, rating: 4.5 }).success).toBe(false);
  });

  it("rejects invalid slug formats", () => {
    expect(feedbackSchema.safeParse({ ...valid, slug: "UPPER" }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...valid, slug: "-leading" }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...valid, slug: "with space" }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...valid, slug: "a".repeat(41) }).success).toBe(
      false,
    );
  });

  it("rejects empty customer_name", () => {
    expect(feedbackSchema.safeParse({ ...valid, customer_name: "" }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...valid, customer_name: "   " }).success).toBe(
      false,
    );
  });

  it("rejects oversized comment", () => {
    expect(
      feedbackSchema.safeParse({ ...valid, comment: "x".repeat(1001) }).success,
    ).toBe(false);
  });

  it("rejects when honeypot is filled", () => {
    expect(feedbackSchema.safeParse({ ...valid, hp: "bot" }).success).toBe(false);
  });
});
