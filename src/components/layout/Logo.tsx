import Link from "next/link";
import { LogoMark } from "./LogoMark";

export function Logo({
  compact = false,
  withTagline = false,
}: {
  compact?: boolean;
  withTagline?: boolean;
}) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <LogoMark size={36} />
      {!compact ? (
        <span className="leading-none">
          <span className="font-alumni block text-[1.35rem] font-bold uppercase tracking-[0.12em] text-ink">
            Zenvyro
          </span>
          {withTagline ? (
            <span className="mt-1 block text-[10px] uppercase tracking-[0.28em] text-ink-muted">
              Web Studio
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
