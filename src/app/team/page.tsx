import type { Metadata } from "next";
import { TeamView } from "@/components/team/TeamView";

export const metadata: Metadata = {
  title: "Люди",
  description: "Владимир, Юра, Александр и Алан — команда Zenvyro.",
};

export default function TeamPage() {
  return <TeamView />;
}
