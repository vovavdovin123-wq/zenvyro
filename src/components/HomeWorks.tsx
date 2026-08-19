"use client";

import Link from "next/link";
import { CardDots } from "@/components/CardDots";
import { TopoStage } from "@/components/TopoStage";
import { WorkGrid } from "@/components/WorkGrid";

export function HomeWorks() {
  return (
    <section className="zn-sec">
      <div className="zn-inner">
        <TopoStage>
          <header data-topo-window className="zn-has-dots zn-works-banner">
            <CardDots />
            <div className="zn-works-banner-inner">
              <div>
                <p className="zn-kicker">Избранное</p>
                <h2 className="zn-title">Кейсы</h2>
              </div>
              <Link href="/works" className="zn-more">
                Все кейсы
              </Link>
            </div>
          </header>
          <WorkGrid limit={4} />
        </TopoStage>
      </div>
    </section>
  );
}
