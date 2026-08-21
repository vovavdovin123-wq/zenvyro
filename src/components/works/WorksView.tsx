"use client";

import { CardDots } from "@/components/effects/CardDots";
import { TopoStage } from "@/components/effects/TopoStage";
import { WorkGrid } from "@/components/works/WorkGrid";
import "@/styles/works.css";

export function WorksView() {
  return (
    <div className="zn-works">
      <div className="zn-works-shell">
        <TopoStage>
          <header data-topo-window className="zn-has-dots zn-works-intro">
            <CardDots />
            <div className="zn-works-intro-inner">
              <p className="zn-works-kicker">Избранное</p>
              <h1 className="zn-works-title">Кейсы.</h1>
              <p className="zn-works-sub">Четыре истории: ателье, запись, Telegram и редакция.</p>
            </div>
          </header>
          <WorkGrid />
        </TopoStage>
      </div>
    </div>
  );
}
