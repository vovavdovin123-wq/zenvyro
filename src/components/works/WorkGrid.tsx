import Link from "next/link";
import { WorkCover } from "@/components/works/WorkCover";
import { categoryLabel, works, type Work } from "@/content/works";

export function WorkGrid({ limit }: { limit?: number }) {
  const items = limit ? works.slice(0, limit) : works;

  return (
    <div className="flex flex-col">
      {items.map((work, index) => (
        <WorkRow key={work.slug} work={work} reverse={index % 2 === 1} last={index === items.length - 1} />
      ))}
    </div>
  );
}

function WorkRow({ work, reverse, last }: { work: Work; reverse: boolean; last: boolean }) {
  return (
    <Link
      href={`/works/${work.slug}`}
      className={`group grid items-center gap-8 py-10 lg:grid-cols-2 lg:gap-14 lg:py-14 ${last ? "" : "work-row"}`}
    >
      <div data-topo-window className={`relative overflow-hidden rounded-[1.6rem] ${reverse ? "lg:order-2" : ""}`}>
        <WorkCover />
      </div>
      <div className={reverse ? "lg:order-1" : ""}>
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">
          {categoryLabel[work.category]} · {work.year}
        </p>
        <h3 className="font-display mt-3 text-4xl sm:text-5xl">{work.title}</h3>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted">{work.summary}</p>
        <span className="mt-6 inline-flex text-sm text-lavender transition group-hover:text-ink">Открыть кейс</span>
      </div>
    </Link>
  );
}
