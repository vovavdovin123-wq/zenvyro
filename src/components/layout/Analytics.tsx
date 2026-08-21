"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function ping(event: "pageview" | "session" | "apply_start" | "apply_submit") {
  void fetch("/api/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  });
}

export function pingApplyStart() {
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem("zn_apply_start")) return;
  sessionStorage.setItem("zn_apply_start", "1");
  ping("apply_start");
}

export function pingApplySubmit() {
  // Counted server-side in POST /api/orders so the public /api/stats cannot inflate submits.
}

export function Analytics() {
  const pathname = usePathname();
  const seen = useRef(false);

  useEffect(() => {
    if (pathname.startsWith("/studio")) return;
    ping("pageview");
    if (!seen.current && !sessionStorage.getItem("zn_session")) {
      sessionStorage.setItem("zn_session", "1");
      ping("session");
    }
    seen.current = true;
  }, [pathname]);

  return null;
}
