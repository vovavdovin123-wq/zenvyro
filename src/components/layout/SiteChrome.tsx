"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "./Analytics";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const studio = usePathname().startsWith("/studio");

  return (
    <>
      <Analytics />
      {studio ? null : <Header />}
      <main className={studio ? "h-dvh overflow-hidden" : "flex-1"}>{children}</main>
      {studio ? null : <Footer />}
    </>
  );
}
