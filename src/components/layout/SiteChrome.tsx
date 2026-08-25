"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "./Analytics";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const studio = path.startsWith("/studio");
  const demo = path.startsWith("/demo");
  const bare = studio || demo;

  return (
    <>
      <Analytics />
      {bare ? null : <Header />}
      <main className={studio ? "h-dvh overflow-hidden" : "flex-1"}>{children}</main>
      {bare ? null : <Footer />}
    </>
  );
}
