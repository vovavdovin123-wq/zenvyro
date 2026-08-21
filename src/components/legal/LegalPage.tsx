import type { ReactNode } from "react";
import "@/styles/legal.css";

export function LegalPage({
  kicker,
  title,
  lead,
  children,
}: {
  kicker: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="zn-legal">
      <div className="zn-inner">
        <p className="zn-kicker">{kicker}</p>
        <h1 className="zn-legal-title">{title}</h1>
        {lead ? <p className="zn-legal-lead">{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}
