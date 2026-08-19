import type { Metadata } from "next";
import { WorksView } from "@/components/WorksView";

export const metadata: Metadata = {
  title: "Кейсы",
  description: "Избранные проекты Zenvyro: сайты, сервисы и Telegram.",
};

export default function WorksPage() {
  return <WorksView />;
}
