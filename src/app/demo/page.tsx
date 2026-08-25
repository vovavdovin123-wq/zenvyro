import type { Metadata } from "next";
import { RoasterView } from "@/components/demo/RoasterView";
import "@/styles/demo.css";

export const metadata: Metadata = {
  title: "Северная обжарка",
  description: "Тестовый лендинг по ТЗ: три лота зерна и заявка на неделю.",
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return <RoasterView />;
}
