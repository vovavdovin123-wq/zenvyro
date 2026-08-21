import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Согласие на обработку ПДн",
  description: "Согласие на обработку персональных данных Zenvyro.",
};

export default function ConsentPage() {
  return <LegalPage kicker="Документы" title="Согласие на обработку ПДн" />;
}
