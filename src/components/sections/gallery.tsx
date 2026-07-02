"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { GALLERY_IMAGES } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/section-heading";
import { scaleIn, staggerContainerFast, viewportOnce } from "@/lib/motion";

export function Gallery() {
  return (
    <section id="gallery" className="section-padding bg-charcoal">
      <div className="container-narrow">
        <SectionHeading label="Gallery" title="The work" className="mb-12" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainerFast}
          className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
        >
          {GALLERY_IMAGES.map((image, i) => (
            <motion.div
              key={image.id}
              variants={scaleIn}
              className={`group relative overflow-hidden ${
                i === 0
                  ? "col-span-2 row-span-2 aspect-[3/4] md:col-span-2 md:row-span-2 md:min-h-[480px]"
                  : "aspect-[3/4]"
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                sizes={
                  i === 0
                    ? "(max-width: 768px) 100vw, 50vw"
                    : "(max-width: 768px) 50vw, 25vw"
                }
              />
              <div className="absolute inset-0 bg-background/0 transition-colors duration-500 group-hover:bg-background/40" />
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-background/80 to-transparent p-4 transition-transform duration-500 group-hover:translate-y-0">
                <p className="text-sm font-medium text-foreground">
                  {image.alt}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
