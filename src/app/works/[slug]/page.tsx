import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkCase } from "@/components/WorkCase";
import { getWork, nextWork, works } from "@/lib/works";
import "@/components/works.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return works.map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) return { title: "Кейс" };
  return {
    title: work.title,
    description: work.summary,
  };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) notFound();

  return <WorkCase work={work} next={nextWork(work.slug)} />;
}
