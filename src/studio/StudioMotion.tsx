"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export const pressTransition = { type: "spring" as const, stiffness: 520, damping: 34, mass: 0.6 };

export const press = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.96 },
  transition: pressTransition,
};

export function StudioPage({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className="zn-dash-swap"
        initial={reduce ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={reduce ? undefined : { opacity: 0, y: -12, filter: "blur(6px)" }}
        transition={{ duration: reduce ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
