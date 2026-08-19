"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function CoverHero({ slug, src, alt }: { slug: string; src: string; alt: string }) {
  return (
    <motion.div layoutId={`cover-${slug}`} className="relative h-[70svh] min-h-[420px] overflow-hidden">
      <Image src={src} alt={alt} fill className="object-cover" unoptimized priority />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/20 to-transparent" />
    </motion.div>
  );
}
