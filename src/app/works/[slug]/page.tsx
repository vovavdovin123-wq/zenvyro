import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkCase } from "@/components/works/WorkCase";
import { getWork, nextWork, works } from "@/content/works";
import "@/styles/works.css";

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
    openGraph: {
      title: work.title,
      description: work.summary,
    },
  };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) notFound();

  const next = nextWork(work.slug);
  if (!next) notFound();
  return <WorkCase work={work} next={next} />;
}
