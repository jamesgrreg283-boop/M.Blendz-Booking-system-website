"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Instagram, Clock } from "lucide-react";
import { CONTACT, OPENING_HOURS } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/section-heading";
import { slideInLeft, slideInRight, staggerContainerFast, viewportOnce } from "@/lib/motion";

const CONTACT_ITEMS: {
  icon: typeof MapPin;
  title: string;
  content: string;
  link?: { href: string; label: string; external?: boolean };
}[] = [
  {
    icon: MapPin,
    title: "Address",
    content: CONTACT.address,
    link: { href: CONTACT.mapsHref, label: "View on Google Maps", external: true },
  },
  {
    icon: Phone,
    title: "Phone",
    content: CONTACT.phone,
    link: { href: CONTACT.phoneHref, label: CONTACT.phone },
  },
  {
    icon: Instagram,
    title: "Instagram",
    content: CONTACT.instagram,
    link: { href: CONTACT.instagramHref, label: CONTACT.instagram, external: true },
  },
];

export function Contact() {
  return (
    <section id="contact" className="section-padding bg-charcoal">
      <div className="container-narrow">
        <SectionHeading
          label="Location"
          title="Find us in Coventry"
          className="mb-12"
        />

        <div className="grid gap-10 lg:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainerFast}
            className="space-y-6"
          >
            {CONTACT_ITEMS.map((item) => (
              <motion.div
                key={item.title}
                variants={slideInLeft}
                className="group flex items-start gap-4"
              >
                <div className="mt-1 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110">
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-muted-foreground">{item.content}</p>
                  {item.link && (
                    <a
                      href={item.link.href}
                      target={item.link.external ? "_blank" : undefined}
                      rel={item.link.external ? "noopener noreferrer" : undefined}
                      className="mt-1 inline-block text-sm text-primary transition-colors hover:text-primary/80"
                    >
                      {item.link.label}
                    </a>
                  )}
                </div>
              </motion.div>
            ))}

            <motion.div
              variants={slideInLeft}
              className="flex items-start gap-4"
            >
              <Clock className="mt-1 shrink-0 text-primary" size={20} />
              <div>
                <p className="font-medium text-foreground">Opening Hours</p>
                <dl className="mt-2 space-y-1">
                  {OPENING_HOURS.map((h, i) => (
                    <motion.div
                      key={h.day}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={viewportOnce}
                      transition={{ delay: i * 0.04 }}
                      className="flex justify-between gap-8 text-sm"
                    >
                      <dt className="text-muted-foreground">{h.day}</dt>
                      <dd className="text-foreground">
                        {h.open && h.close
                          ? `${h.open} – ${h.close}`
                          : "Closed"}
                      </dd>
                    </motion.div>
                  ))}
                </dl>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideInRight}
            className="group relative aspect-[4/3] overflow-hidden border border-border bg-muted lg:aspect-auto lg:min-h-[360px]"
          >
            <iframe
              title="M.Blendz location"
              src={CONTACT.mapsEmbed}
              className="absolute inset-0 h-full w-full border-0 opacity-80 grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
