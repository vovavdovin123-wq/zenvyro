import type { Metadata } from "next";
import { ContactsView } from "@/components/legal/ContactsView";

export const metadata: Metadata = {
  title: "Документы и контакты",
  description: "Реквизиты, документы и контакты Zenvyro.",
};

export default function RequisitesPage() {
  return <ContactsView />;
}
