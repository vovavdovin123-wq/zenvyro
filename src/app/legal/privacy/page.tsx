import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Политика конфиденциальности Zenvyro.",
};

export default function PrivacyPage() {
  return <LegalPage kicker="Документы" title="Политика конфиденциальности" />;
}
