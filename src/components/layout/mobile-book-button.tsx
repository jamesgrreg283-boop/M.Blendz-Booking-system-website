"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

export function MobileBookButton() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [0, 1]);
  const y = useTransform(scrollY, [0, 200], [20, 0]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 pt-4 backdrop-blur-md md:hidden"
    >
      <Button asChild className="w-full shadow-lg shadow-primary/10" size="lg">
        <a href="#booking">Book Now</a>
      </Button>
    </motion.div>
  );
}
