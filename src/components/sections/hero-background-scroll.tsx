"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ScrollIndicator() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return null;

  return (
    <motion.a
      href="#services"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4, duration: 0.6 }}
      className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground"
      aria-label="Scroll to services"
    >
      <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="h-8 w-px bg-gradient-to-b from-primary/60 to-transparent"
      />
    </motion.a>
  );
}
