import type { Metadata } from "next";
import { ProcessView } from "@/components/ProcessView";

export const metadata: Metadata = {
  title: "Процесс",
  description: "Как устроен заказ в Zenvyro: от заявки до сдачи.",
};

export default function ProcessPage() {
  return <ProcessView />;
}
