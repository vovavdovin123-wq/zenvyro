import { describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(async () =>
    JSON.stringify({
      orders: [
        {
          id: "paused001",
          status: "paused",
          client: { name: "Клиент", telegramId: 42, telegramUsername: "client" },
        },
      ],
    }),
  ),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

import { findOrderByTelegram } from "@/studio/store";
import { readSrc } from "./helpers";

describe("paused order resume", () => {
  it("fails when findOrderByTelegram drops paused orders (клиент пишет «продолжить» в пустоту)", async () => {
    const found = await findOrderByTelegram(42);
    expect(found?.id).toBe("paused001");
    expect(found?.status).toBe("paused");
  });

  it("fails when templates promise a resume word the lookup cannot see", () => {
    const templates = readSrc("studio", "templates.ts");
    const store = readSrc("studio", "store.ts");
    expect(templates).toMatch(/продолжить/);
    expect(store).not.toMatch(/status !== "paused"/);
  });
});
