import { StudioProvider } from "@/studio/useStudio";
import { StudioFrame } from "@/studio/StudioShell";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/studio.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Студия — Zenvyro",
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <StudioProvider>
      <StudioFrame>{children}</StudioFrame>
    </StudioProvider>
  );
}
