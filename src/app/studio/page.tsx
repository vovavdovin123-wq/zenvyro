import { StudioOverview } from "@/studio/StudioOverview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Обзор — Студия",
};

export default function StudioPage() {
  return <StudioOverview />;
}
