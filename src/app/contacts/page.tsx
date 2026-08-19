import type { Metadata } from "next";
import { ContactsView } from "@/components/ContactsView";

export const metadata: Metadata = {
  title: "Контакты и реквизиты",
  description: "Реквизиты Zenvyro.",
};

export default function ContactsPage() {
  return <ContactsView />;
}
