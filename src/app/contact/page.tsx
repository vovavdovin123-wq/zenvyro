import type { Metadata } from "next";
import { ApplyHero } from "@/components/ApplyHero";

export const metadata: Metadata = {
  title: "Обсудить проект",
  description: "Написать в студию Zenvyro.",
};

export default function ContactPage() {
  return <ApplyHero page />;
}
