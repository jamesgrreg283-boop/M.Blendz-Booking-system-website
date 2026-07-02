"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BUSINESS_NAME, BUSINESS_TAGLINE } from "@/lib/constants";
import { staggerContainer, fadeUp } from "@/lib/motion";
import {
  HeroBackground,
  FilmGrain,
  ScrollIndicator,
} from "./hero-background";

const HEADLINE_LINES = [
  "Sharp cuts.",
  "Smooth fades.",
  "Coventry barbering done properly.",
];

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
      <HeroBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/75 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
      <FilmGrain />

      <div className="container-narrow relative z-10 px-5 pt-24 pb-32 md:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-2xl"
        >
          <motion.div variants={fadeUp} className="mb-6 flex items-center gap-4">
            <Image
              src="/logo.png"
              alt={BUSINESS_NAME}
              width={56}
              height={56}
              className="rounded-full"
            />
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                {BUSINESS_NAME}
              </p>
              <p className="text-xs text-muted-foreground">{BUSINESS_TAGLINE}</p>
            </div>
          </motion.div>

          <h1 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
            {reduceMotion ? (
              HEADLINE_LINES.join(" ")
            ) : (
              HEADLINE_LINES.map((line) => (
                <motion.span
                  key={line}
                  variants={fadeUp}
                  className="block"
                >
                  {line}
                </motion.span>
              ))
            )}
          </h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-lg text-lg text-muted-foreground"
          >
            Book your next trim online in seconds.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4"
          >
            <Button asChild size="lg" className="group relative overflow-hidden">
              <a href="#booking">
                <span className="relative z-10">Book Appointment</span>
                <span className="absolute inset-0 -translate-x-full bg-primary-foreground/10 transition-transform duration-300 group-hover:translate-x-0" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#services">View Prices</a>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
