import { describe, expect, it } from "vitest";
import { categories, works } from "@/content/works";
import { nextWork } from "@/content/works";

describe("works empty / broken states", () => {
  it("fails when the Сопровождение category exists with zero cases", () => {
    expect(categories.some((item) => item.id === "support")).toBe(true);
    expect(works.some((work) => work.category === "support")).toBe(true);
  });

  it("fails when nextWork(unknown slug) silently returns the first case", () => {
    expect(nextWork("this-slug-does-not-exist")).toBeUndefined();
  });
});
