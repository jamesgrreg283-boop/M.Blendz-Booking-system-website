"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { fadeUp, viewportOnce } from "@/lib/motion";
import { Button } from "@/components/ui/button";

export function Reviews() {
  return (
    <section id="reviews" className="section-padding">
      <div className="container-narrow">
        <SectionHeading
          label="Reviews"
          title="What clients say"
          align="center"
          className="mb-12"
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mx-auto max-w-md border border-border bg-card p-8 text-center md:p-12"
        >
          <div className="mb-4 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={20}
                className="text-muted-foreground/30"
              />
            ))}
          </div>
          <p className="text-lg font-medium text-foreground">
            Be the first to review us
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Had a great cut at M.Blendz? We&apos;d love to hear from you.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <a
              href="https://maps.google.com/?q=3+Crescent+Avenue+Coventry+CV3+1HD"
              target="_blank"
              rel="noopener noreferrer"
            >
              Write a Review
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
