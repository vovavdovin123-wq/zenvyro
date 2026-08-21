"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { applyAccent, DEFAULT_ACCENT, readAccent, readPlayground, saveAccent, savePlayground, type PlaygroundSnap } from "@/lib/accent";

type PlaygroundContextValue = {
  snap: PlaygroundSnap;
  hydrated: boolean;
  commit: (next: PlaygroundSnap) => void;
};

const PlaygroundContext = createContext<PlaygroundContextValue | null>(null);

const emptySnap: PlaygroundSnap = { values: { color: DEFAULT_ACCENT }, preset: 0 };

export function AccentProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<PlaygroundSnap>(emptySnap);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    const stored = readPlayground();
    const color = stored?.values?.color ? String(stored.values.color) : readAccent();
    if (stored?.values) {
      const next: PlaygroundSnap = {
        values: stored.values,
        preset: typeof stored.preset === "number" ? stored.preset : null,
      };
      setSnap(next);
      applyAccent(String(next.values.color ?? DEFAULT_ACCENT));
    } else if (color) {
      setSnap({ values: { color }, preset: null });
      applyAccent(color);
    }
    setHydrated(true);
  }, []);

  const commit = useCallback((next: PlaygroundSnap) => {
    setSnap(next);
    const color = String(next.values.color ?? DEFAULT_ACCENT);
    applyAccent(color);
    saveAccent(color);
    savePlayground(next);
  }, []);

  const value = useMemo(() => ({ snap, hydrated, commit }), [snap, hydrated, commit]);

  return <PlaygroundContext.Provider value={value}>{children}</PlaygroundContext.Provider>;
}

export function usePlayground() {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) throw new Error("usePlayground must be used within AccentProvider");
  return ctx;
}
