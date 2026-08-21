import { describe, expect, it } from "vitest";
import { templates } from "@/studio/templates";
import { makeOrder } from "./helpers";

describe("Telegram HTML escaping", () => {
  it("escapes a quote in email so it cannot break out of the mailto href", () => {
    const html = templates.adminReview(
      makeOrder({
        client: {
          name: "Тест",
          email: `a@b.c"onclick="x`,
        },
      }),
    );
    expect(html).not.toContain('onclick="');
    expect(html).not.toContain(`href="mailto:a@b.c"`);
  });

  it("rejects a quote in Telegram username instead of breaking the t.me href", () => {
    const html = templates.adminReview(
      makeOrder({
        client: {
          name: "Тест",
          telegramUsername: `user" href="https://evil.example`,
        },
      }),
    );
    expect(html).not.toContain(`href="https://evil.example`);
    expect(html).not.toMatch(/onclick=/);
  });
});
