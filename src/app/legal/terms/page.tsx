import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Пользовательское соглашение",
  description: "Пользовательское соглашение Zenvyro.",
};

export default function TermsPage() {
  return <LegalPage kicker="Документы" title="Пользовательское соглашение" />;
}
