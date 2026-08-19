import type { ReactNode } from "react";

export function ElectricBorder({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex rounded-full p-[1px] ${className}`}>
      <span className="absolute inset-0 rounded-full bg-brand opacity-90" />
      <span className="relative inline-flex rounded-full">{children}</span>
    </span>
  );
}
