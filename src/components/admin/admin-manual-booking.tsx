"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SERVICES, BARBERS } from "@/lib/constants";
import {
  formatDisplayTime,
  getNextAvailableDates,
} from "@/lib/booking-utils";
import { cn } from "@/lib/utils";

interface AdminManualBookingProps {
  onCreated: () => void;
}

export function AdminManualBooking({ onCreated }: AdminManualBookingProps) {
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    service: SERVICES[0].id,
    barber: BARBERS[0].id,
    date: "",
    time: "",
    notes: "",
    status: "confirmed" as const,
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const dates = getNextAvailableDates(30);

  const fetchSlots = useCallback(async () => {
    if (!form.barber || !form.date || !form.service) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/slots?barber=${form.barber}&date=${form.date}&service=${form.service}`
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
    } finally {
      setLoadingSlots(false);
    }
  }, [form.barber, form.date, form.service]);

  useEffect(() => {
    if (form.date) fetchSlots();
  }, [form.date, form.service, fetchSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");

      setSuccess(true);
      setForm({
        customer_name: "",
        phone: "",
        email: "",
        service: SERVICES[0].id,
        barber: BARBERS[0].id,
        date: "",
        time: "",
        notes: "",
        status: "confirmed",
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="mb-2 text-xl font-semibold">Add Manual Booking</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Walk-ins, phone bookings, or appointments added on behalf of a client.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="m-name">Customer name</Label>
            <Input
              id="m-name"
              value={form.customer_name}
              onChange={(e) =>
                setForm({ ...form, customer_name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-phone">Phone</Label>
            <Input
              id="m-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-email">Email (optional)</Label>
            <Input
              id="m-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Service</Label>
          <div className="space-y-2">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  setForm({ ...form, service: s.id, time: "" })
                }
                className={cn(
                  "flex min-h-12 w-full items-center justify-between border p-4 text-left text-sm active:scale-[0.99]",
                  form.service === s.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <span>{s.name}</span>
                <span className="text-primary">£{s.price}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="m-date">Date</Label>
          <select
            id="m-date"
            value={form.date}
            onChange={(e) =>
              setForm({ ...form, date: e.target.value, time: "" })
            }
            className="flex h-12 w-full rounded-sm border border-input bg-card px-4 text-base sm:text-sm"
            required
          >
            <option value="">Select date</option>
            {dates.map((d) => (
              <option key={d} value={d}>
                {new Date(d + "T12:00:00").toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </option>
            ))}
          </select>
        </div>

        {form.date && (
          <div className="space-y-2">
            <Label>Time</Label>
            {loadingSlots ? (
              <Loader2 className="animate-spin text-primary" size={20} />
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No slots available for this date.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setForm({ ...form, time: slot })}
                    className={cn(
                      "touch-target border p-2.5 text-center text-sm active:scale-[0.98]",
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

        <div className="space-y-2">
          <Label htmlFor="m-notes">Notes (optional)</Label>
          <Input
            id="m-notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Walk-in, regular client, etc."
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && (
          <p className="text-sm text-green-400">Booking added successfully.</p>
        )}

        <Button
          type="submit"
          disabled={submitting || !form.time}
          className="h-12 w-full text-base"
        >
          {submitting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            "Add Booking"
          )}
        </Button>
      </form>
    </div>
  );
}
