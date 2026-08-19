import { CardDots } from "@/components/CardDots";

export function WorkCover({ title }: { title: string }) {
  return (
    <div className="zn-has-dots relative aspect-[16/10] overflow-hidden bg-transparent">
      <CardDots />
      <div className="pointer-events-none absolute inset-[7.5%] rounded-[1.4rem] border border-white/[0.12] bg-[#120F17]/20" />
      <p className="pointer-events-none absolute bottom-[11%] left-[10%] font-display text-3xl font-bold text-white sm:text-4xl">
        {title}
      </p>
    </div>
  );
}
