import { describe, expect, it, vi } from "vitest";
import { makeOrder } from "./helpers";

const writeFile = vi.fn(async () => undefined);

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(async () => "{not-json"),
  writeFile: (...args: unknown[]) => writeFile(...args),
  mkdir: vi.fn(async () => undefined),
}));

import { upsertOrder } from "@/studio/store";

describe("order store", () => {
  it("fails when corrupt db.json is treated as an empty database and overwritten", async () => {
    await expect(upsertOrder(makeOrder())).rejects.toThrow();
    expect(writeFile).not.toHaveBeenCalled();
  });
});
