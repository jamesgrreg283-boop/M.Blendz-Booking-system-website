"use client";

import { motion } from "framer-motion";
import { fadeUp, lineReveal, staggerContainer, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  label: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  label,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className={cn(
        align === "center" && "text-center",
        className
      )}
    >
      <motion.div variants={fadeUp} className="flex flex-col items-start gap-3">
        {align === "center" && (
          <motion.div
            variants={lineReveal}
            className="mx-auto h-px w-12 origin-center bg-primary"
          />
        )}
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          {label}
        </p>
        {align === "left" && (
          <motion.div
            variants={lineReveal}
            className="h-px w-12 origin-left bg-primary"
          />
        )}
      </motion.div>
      <motion.h2
        variants={fadeUp}
        className="mt-4 text-3xl font-bold tracking-tight md:text-4xl"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          variants={fadeUp}
          className={cn(
            "mt-3 max-w-lg text-muted-foreground",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
