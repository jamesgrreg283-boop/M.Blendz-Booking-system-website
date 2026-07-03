"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { getServiceCategories } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/section-heading";
import { staggerContainerFast, fadeUp, viewportOnce } from "@/lib/motion";
import { useServices } from "@/hooks/use-services";

export function Services() {
  const { services, loading } = useServices();
  const categories = getServiceCategories(services);

  return (
    <section id="services" className="section-padding bg-charcoal">
      <div className="container-narrow">
        <SectionHeading
          label="Services"
          title="Prices"
          description="Straightforward pricing. No surprises."
          className="mb-12"
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {category}
                </h3>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  variants={staggerContainerFast}
                  className="divide-y divide-border border-y border-border"
                >
                  {services
                    .filter((s) => s.category === category)
                    .map((service) => (
                      <motion.div
                        key={service.id}
                        variants={fadeUp}
                        className="group relative flex items-center justify-between overflow-hidden py-6 px-2 -mx-2 transition-colors hover:bg-muted/30"
                      >
                        <div className="absolute bottom-0 left-0 h-px w-0 bg-primary transition-all duration-500 group-hover:w-full" />
                        <div className="transition-transform duration-300 group-hover:translate-x-1">
                          <h3 className="text-lg font-medium text-foreground">
                            {service.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {service.duration} min
                          </p>
                        </div>
                        <span className="text-xl font-semibold text-primary transition-transform duration-300 group-hover:scale-105">
                          £{service.price}
                        </span>
                      </motion.div>
                    ))}
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
