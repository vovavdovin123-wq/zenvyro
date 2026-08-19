"use client";

import { motion } from "framer-motion";
import type { ElementType } from "react";

type SplitTextProps = {
  text: string;
  className?: string;
  as?: ElementType;
  delay?: number;
};

export function SplitText({ text, className = "", as: Tag = "p", delay = 0 }: SplitTextProps) {
  const words = text.split(" ");
  return (
    <Tag className={className}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="mr-[0.22em] inline-block"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.55,
            delay: delay + index * 0.055,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}
