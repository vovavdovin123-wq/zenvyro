import { StudioFunnel } from "@/studio/StudioFunnel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Воронка — Студия",
};

export default function StudioFunnelPage() {
  return <StudioFunnel />;
}
