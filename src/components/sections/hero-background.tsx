"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { HERO_IMAGE } from "@/lib/constants";

export function HeroBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className={`object-cover object-center ${
          reduceMotion ? "" : "animate-ken-burns-slow scale-105"
        }`}
        sizes="100vw"
        aria-hidden="true"
      />
    </div>
  );
}

export function FilmGrain() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] opacity-[0.04] mix-blend-overlay animate-grain"
      aria-hidden="true"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }}
    />
  );
}

export { ScrollIndicator } from "./hero-background-scroll";
