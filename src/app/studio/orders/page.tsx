import { StudioOrders } from "@/studio/StudioOrders";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Заказы — Студия",
};

export default function StudioOrdersPage() {
  return <StudioOrders />;
}
