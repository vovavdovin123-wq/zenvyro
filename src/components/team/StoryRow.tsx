import { WorkCover } from "@/components/works/WorkCover";

export function StoryRow({
  cover,
  kicker,
  title,
  text,
  reverse = false,
  last = false,
}: {
  cover: string;
  kicker: string;
  title: string;
  text: string;
  reverse?: boolean;
  last?: boolean;
}) {
  return (
    <article className={`grid items-center gap-8 py-10 lg:grid-cols-2 lg:gap-14 lg:py-14 ${last ? "" : "work-row"}`}>
      <div data-topo-window className={`relative overflow-hidden rounded-[1.6rem] ${reverse ? "lg:order-2" : ""}`}>
        <WorkCover title={cover} />
      </div>
      <div className={reverse ? "lg:order-1" : ""}>
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">{kicker}</p>
        <h3 className="font-display mt-3 text-4xl sm:text-5xl">{title}</h3>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted">{text}</p>
      </div>
    </article>
  );
}
