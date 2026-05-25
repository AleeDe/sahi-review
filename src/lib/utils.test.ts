import { describe, it, expect } from "vitest";
import { cn, sha256Hex } from "./utils";

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("sha256Hex", () => {
  it("produces stable 64-char hex hash", async () => {
    const h = await sha256Hex("hello");
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe(await sha256Hex("hello"));
  });

  it("differs by salt", async () => {
    const a = await sha256Hex("phone:biz1");
    const b = await sha256Hex("phone:biz2");
    expect(a).not.toBe(b);
  });
});
