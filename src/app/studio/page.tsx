import { StudioBoard } from "@/components/StudioBoard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Студия — Zenvyro",
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="font-display text-4xl">Студия</h1>
      <p className="mt-3 text-ink-muted">
        Внутренний контур.
      </p>
      <div className="mt-10">
        <StudioBoard />
      </div>
    </div>
  );
}
