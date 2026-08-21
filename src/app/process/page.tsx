import type { Metadata } from "next";
import { ProcessView } from "@/components/process/ProcessView";

export const metadata: Metadata = {
  title: "Процесс",
  description: "Как мы работаем: знакомство, MVP, запуск, продукт и поддержка.",
};

export default function ProcessPage() {
  return <ProcessView />;
}
