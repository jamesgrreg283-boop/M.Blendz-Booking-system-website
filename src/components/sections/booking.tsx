"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  User,
  Clock,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BARBERS, BOOKING_POLICY } from "@/lib/constants";
import { useServices } from "@/hooks/use-services";
import {
  getNextAvailableDates,
  formatDisplayDate,
  formatDisplayTime,
} from "@/lib/booking-utils";
import { SectionHeading } from "@/components/ui/section-heading";
import { fadeUp, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Service", icon: Scissors },
  { id: 2, label: "Barber", icon: User },
  { id: 3, label: "Date", icon: Calendar },
  { id: 4, label: "Time", icon: Clock },
  { id: 5, label: "Details", icon: User },
  { id: 6, label: "Confirm", icon: Check },
];

interface BookingFormData {
  service: string;
  barber: string;
  date: string;
  time: string;
  customer_name: string;
  phone: string;
  email: string;
}

const initialForm: BookingFormData = {
  service: "",
  barber: "",
  date: "",
  time: "",
  customer_name: "",
  phone: "",
  email: "",
};

export function Booking() {
  const { services, loading: loadingServices } = useServices();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingFormData>(initialForm);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const availableDates = getNextAvailableDates(14);

  const updateForm = (fields: Partial<BookingFormData>) => {
    setForm((prev) => ({ ...prev, ...fields }));
    setError("");
  };

  const fetchSlots = useCallback(
    async (barber: string, date: string, service: string) => {
      setLoadingSlots(true);
      try {
        const res = await fetch(
          `/api/slots?barber=${encodeURIComponent(barber)}&date=${encodeURIComponent(date)}&service=${encodeURIComponent(service)}`
        );
        const data = await res.json();
        setSlots(data.slots ?? []);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    []
  );

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!form.service;
      case 2:
        return !!form.barber;
      case 3:
        return !!form.date;
      case 4:
        return !!form.time;
      case 5:
        return !!(form.customer_name.trim() && form.phone.trim());
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (step === 3 && form.barber && form.date && form.service) {
      await fetchSlots(form.barber, form.date, form.service);
    }
    if (step < 6) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = services.find((s) => s.id === form.service);
  const selectedBarber = BARBERS.find((b) => b.id === form.barber);

  if (confirmed) {
    return (
      <section id="booking" className="section-padding">
        <div className="container-narrow max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-border bg-card p-8 text-center md:p-12"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Check className="text-primary" size={32} />
            </div>
            <h2 className="text-2xl font-bold">Booking confirmed</h2>
            <p className="mt-3 text-muted-foreground">
              You&apos;re booked in. We&apos;ll see you soon.
            </p>
            <dl className="mt-8 space-y-3 text-left text-sm">
              <div className="flex justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Service</dt>
                <dd className="font-medium">{selectedService?.name}</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Barber</dt>
                <dd className="font-medium">{selectedBarber?.name}</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="font-medium">{formatDisplayDate(form.date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Time</dt>
                <dd className="font-medium">{formatDisplayTime(form.time)}</dd>
              </div>
            </dl>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="section-padding">
      <div className="container-narrow max-w-2xl">
        <SectionHeading
          label="Booking"
          title="Book your appointment"
          align="center"
          className="mb-6"
        />

        <div className="mb-8 border border-border bg-card p-5 text-sm">
          <p className="font-medium text-primary">{BOOKING_POLICY.title}</p>
          <ul className="mt-3 space-y-1.5 text-muted-foreground">
            {BOOKING_POLICY.items.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            {BOOKING_POLICY.notice}
          </p>
        </div>

        {/* Step indicator */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mb-8 flex items-center justify-between px-2"
        >
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  step >= s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s.id ? <Check size={14} /> : s.id}
              </div>
              <span className="hidden text-[10px] text-muted-foreground sm:block">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>

        <Card>
          <CardContent className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {step === 1 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Choose a service</h3>
                    {loadingServices ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-primary" size={24} />
                      </div>
                    ) : (
                      services.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => updateForm({ service: service.id })}
                          className={cn(
                            "flex w-full items-center justify-between border p-4 text-left transition-all active:scale-[0.99] hover:border-primary/50 min-h-[3.25rem]",
                            form.service === service.id
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          )}
                        >
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {service.duration} min
                            </p>
                          </div>
                          <span className="font-semibold text-primary">
                            £{service.price}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Choose your barber</h3>
                    {BARBERS.map((barber) => (
                      <button
                        key={barber.id}
                        type="button"
                        onClick={() => updateForm({ barber: barber.id })}
                        className={cn(
                          "flex w-full items-center gap-4 border p-4 text-left transition-all active:scale-[0.99] hover:border-primary/50 min-h-[3.25rem]",
                          form.barber === barber.id
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        )}
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-semibold text-primary">
                          {barber.name[0]}
                        </div>
                        <div>
                          <p className="font-medium">{barber.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {barber.role}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Choose a date</h3>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {availableDates.map((date) => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => {
                            updateForm({ date, time: "" });
                            if (form.barber && form.service)
                              fetchSlots(form.barber, date, form.service);
                          }}
                          className={cn(
                            "touch-target border p-3 text-center text-sm transition-all active:scale-[0.98] hover:border-primary/50",
                            form.date === date
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          )}
                        >
                          {new Date(date + "T12:00:00").toLocaleDateString(
                            "en-GB",
                            { weekday: "short", day: "numeric", month: "short" }
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Choose a time</h3>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-primary" size={24} />
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="py-8 text-center text-muted-foreground">
                        No available slots for this date. Please choose another.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                        {slots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => updateForm({ time: slot })}
                            className={cn(
                              "touch-target border p-3 text-center text-sm transition-all active:scale-[0.98] hover:border-primary/50",
                              form.time === slot
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            )}
                          >
                            {formatDisplayTime(slot)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-semibold">Your details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        value={form.customer_name}
                        onChange={(e) =>
                          updateForm({ customer_name: e.target.value })
                        }
                        placeholder="John Smith"
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) =>
                          updateForm({ phone: e.target.value })
                        }
                        placeholder="07XXX XXXXXX"
                        autoComplete="tel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          updateForm({ email: e.target.value })
                        }
                        placeholder="you@email.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-semibold">Confirm booking</h3>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-border pb-3">
                        <dt className="text-muted-foreground">Service</dt>
                        <dd className="font-medium">{selectedService?.name}</dd>
                      </div>
                      <div className="flex justify-between border-b border-border pb-3">
                        <dt className="text-muted-foreground">Barber</dt>
                        <dd className="font-medium">{selectedBarber?.name}</dd>
                      </div>
                      <div className="flex justify-between border-b border-border pb-3">
                        <dt className="text-muted-foreground">Date</dt>
                        <dd className="font-medium">
                          {formatDisplayDate(form.date)}
                        </dd>
                      </div>
                      <div className="flex justify-between border-b border-border pb-3">
                        <dt className="text-muted-foreground">Time</dt>
                        <dd className="font-medium">
                          {formatDisplayTime(form.time)}
                        </dd>
                      </div>
                      <div className="flex justify-between border-b border-border pb-3">
                        <dt className="text-muted-foreground">Name</dt>
                        <dd className="font-medium">{form.customer_name}</dd>
                      </div>
                      <div className="flex justify-between border-b border-border pb-3">
                        <dt className="text-muted-foreground">Phone</dt>
                        <dd className="font-medium">{form.phone}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Email</dt>
                        <dd className="font-medium">{form.email}</dd>
                      </div>
                    </dl>
                    {selectedService && (
                      <p className="text-center text-lg font-semibold text-primary">
                        Total: £{selectedService.price}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {error && (
              <p className="mt-4 text-center text-sm text-red-400">{error}</p>
            )}

            <div className="mt-8 flex items-center justify-between gap-4">
              {step > 1 ? (
                <Button variant="ghost" onClick={handleBack}>
                  <ChevronLeft size={16} />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 6 ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Continue
                  <ChevronRight size={16} />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
