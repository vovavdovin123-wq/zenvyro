import { describe, expect, it } from "vitest";
import { createId } from "@/studio/id";

describe("order ids", () => {
  it("fails when ids are only 4 random bytes (8 hex chars)", () => {
    const id = createId();
    expect(id.length).toBeGreaterThanOrEqual(16);
    expect(id).toMatch(/^[0-9a-f]{16,}$/);
  });
});
