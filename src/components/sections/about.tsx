"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Scissors } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { slideInLeft, slideInRight, viewportOnce } from "@/lib/motion";
import { BUSINESS_NAME, ABOUT_IMAGE } from "@/lib/constants";

export function About() {
  const imageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  return (
    <section id="about" className="section-padding">
      <div className="container-narrow">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            ref={imageRef}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideInLeft}
            className="relative aspect-[4/5] overflow-hidden"
          >
            <motion.div
              style={{ y: imageY }}
              className="absolute inset-0 -top-[8%] -bottom-[8%]"
            >
              <Image
                src={ABOUT_IMAGE}
                alt={`${BUSINESS_NAME} haircut work`}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={viewportOnce}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="absolute bottom-0 left-0 h-1 w-full origin-left bg-primary"
            />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideInRight}
          >
            <SectionHeading
              label="About"
              title="Barbering done properly"
              className="mb-6"
            />
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                {BUSINESS_NAME} is a Coventry barbershop built on precision,
                consistency, and respect for the craft. Specialising in sharp
                haircuts and smooth fades — no rushed jobs, no shortcuts.
              </p>
              <p>
                Whether you need a skin fade, a shape up, or a full haircut and
                beard tidy, every appointment is tailored to you.
              </p>
              <p>Walk in looking rough. Walk out looking sharp.</p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewportOnce}
              transition={{ delay: 0.4 }}
              className="mt-8 flex items-center gap-3 text-primary"
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              >
                <Scissors size={20} />
              </motion.div>
              <span className="text-sm font-medium">
                3 Crescent Avenue, Coventry CV3 1HD
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
