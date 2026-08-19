"use client";

import { LayoutGroup } from "framer-motion";
import type { ReactNode } from "react";

export function MotionRoot({ children }: { children: ReactNode }) {
  return <LayoutGroup>{children}</LayoutGroup>;
}
