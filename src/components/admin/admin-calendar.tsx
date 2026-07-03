"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BARBERS } from "@/lib/constants";
import {
  formatDisplayDate,
  formatDisplayTime,
  getAvailableSlots,
  getOccupiedSlotsForBooking,
  isDateFullyBlocked,
} from "@/lib/booking-utils";
import type { BlockedSlot, Booking, BookingStatus } from "@/types/booking";
import { useServices } from "@/hooks/use-services";
import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "./admin-shared";

type ViewMode = "day" | "week";

interface AdminCalendarProps {
  onChanged?: () => void;
}

export function AdminCalendar({ onChanged }: AdminCalendarProps) {
  const { services } = useServices(true);
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<BlockedSlot | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, blRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/admin/blocked-slots"),
      ]);
      if (bRes.ok) setBookings(await bRes.json());
      if (blRes.ok) setBlocked(await blRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const weekDates = useMemo(() => {
    const start = new Date(selectedDate + "T12:00:00");
    const day = start.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  }, [selectedDate]);

  const dayBookings = bookings.filter(
    (b) => b.date === selectedDate && b.status !== "cancelled"
  );

  const dayBlocks = blocked.filter((b) => {
    const end = b.end_date ?? b.date;
    return selectedDate >= b.date && selectedDate <= end;
  });

  const serviceName = (id: string) =>
    services.find((s) => s.id === id)?.name ?? id;
  const barberName = (id: string) =>
    BARBERS.find((b) => b.id === id)?.name ?? id;

  const updateStatus = async (id: string, status: BookingStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
        setSelectedBooking(updated);
        onChanged?.();
      }
    } finally {
      setUpdating(false);
    }
  };

  const slots = getAvailableSlots(selectedDate);
  const fullyBlocked = BARBERS.some((barber) =>
    isDateFullyBlocked(barber.id, selectedDate, blocked)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Tap an appointment or blocked time for details.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode("day")}
            className={cn(
              "min-h-10 flex-1 rounded-sm px-4 text-sm sm:flex-none",
              viewMode === "day"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground"
            )}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={cn(
              "min-h-10 flex-1 rounded-sm px-4 text-sm sm:flex-none",
              viewMode === "week"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground"
            )}
          >
            Week
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border border-border bg-card p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => shiftDate(viewMode === "week" ? -7 : -1)}
          className="touch-target"
        >
          <ChevronLeft size={20} />
        </Button>
        <p className="text-center text-sm font-medium sm:text-base">
          {viewMode === "day"
            ? formatDisplayDate(selectedDate)
            : `Week of ${formatDisplayDate(weekDates[0])}`}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => shiftDate(viewMode === "week" ? 7 : 1)}
          className="touch-target"
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      {viewMode === "week" ? (
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDates.map((date) => {
            const count = bookings.filter(
              (b) =>
                b.date === date &&
                b.status !== "cancelled" &&
                b.status !== "no_show"
            ).length;
            const isBlocked = BARBERS.some((barber) =>
              isDateFullyBlocked(barber.id, date, blocked)
            );
            return (
              <button
                key={date}
                type="button"
                onClick={() => {
                  setSelectedDate(date);
                  setViewMode("day");
                }}
                className={cn(
                  "min-h-16 border p-2 text-center text-xs transition-colors sm:min-h-20 sm:text-sm",
                  date === selectedDate
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card",
                  isBlocked && "bg-red-500/5"
                )}
              >
                <p className="font-medium">
                  {new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {isBlocked ? "Blocked" : `${count} apt`}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {fullyBlocked && (
            <div className="border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              Full day blocked — holiday or time off
            </div>
          )}

          {dayBlocks
            .filter((b) => !b.time)
            .map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBlock(b)}
                className="flex w-full items-center justify-between border border-red-500/30 bg-red-500/10 p-4 text-left text-sm active:scale-[0.99]"
              >
                <span className="font-medium text-red-300">
                  {b.reason || "Blocked — full day"}
                </span>
                <span className="text-xs text-red-400">Holiday / time off</span>
              </button>
            ))}

          {slots.length === 0 && !fullyBlocked ? (
            <p className="py-8 text-center text-muted-foreground">
              Shop closed on this day.
            </p>
          ) : (
            slots.map((slot) => {
              const booking = dayBookings.find((b) => {
                const svc = services.find((s) => s.id === b.service);
                const duration = svc?.duration ?? 15;
                const occupied = getOccupiedSlotsForBooking(
                  duration,
                  b.time,
                  selectedDate
                );
                return occupied.includes(slot);
              });

              const slotBlock = dayBlocks.find((b) => {
                if (!b.time) return false;
                const start = b.time;
                const end = b.end_time ?? b.time;
                return slot >= start && slot < end;
              });

              if (booking) {
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedBooking(booking)}
                    className="flex w-full flex-col gap-1 border border-primary/30 bg-primary/5 p-4 text-left active:scale-[0.99] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">{booking.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {serviceName(booking.service)} · {barberName(booking.barber)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">
                        {formatDisplayTime(booking.time)}
                      </span>
                      <span
                        className={cn(
                          "rounded-sm border px-2 py-0.5 text-xs capitalize",
                          STATUS_STYLES[booking.status]
                        )}
                      >
                        {booking.status.replace("_", " ")}
                      </span>
                    </div>
                  </button>
                );
              }

              if (slotBlock) {
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedBlock(slotBlock)}
                    className="flex w-full items-center justify-between border border-red-500/20 bg-red-500/5 p-3 text-left text-sm active:scale-[0.99]"
                  >
                    <span className="text-red-300">
                      {slotBlock.reason || "Blocked time"}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDisplayTime(slot)}
                    </span>
                  </button>
                );
              }

              return (
                <div
                  key={slot}
                  className="flex items-center justify-between border border-border/50 bg-card/30 p-3 text-sm text-muted-foreground"
                >
                  <span>Available</span>
                  <span>{formatDisplayTime(slot)}</span>
                </div>
              );
            })
          )}
        </div>
      )}

      {selectedBooking && (
        <DetailModal onClose={() => setSelectedBooking(null)} title="Booking">
          <div className="space-y-3 text-sm">
            <p className="text-lg font-semibold">{selectedBooking.customer_name}</p>
            <p>{serviceName(selectedBooking.service)}</p>
            <p>{barberName(selectedBooking.barber)}</p>
            <p>
              {formatDisplayDate(selectedBooking.date)} at{" "}
              {formatDisplayTime(selectedBooking.time)}
            </p>
            <a href={`tel:${selectedBooking.phone}`} className="text-primary">
              {selectedBooking.phone}
            </a>
            {selectedBooking.email && (
              <p className="text-muted-foreground">{selectedBooking.email}</p>
            )}
            <span
              className={cn(
                "inline-block rounded-sm border px-2 py-0.5 text-xs capitalize",
                STATUS_STYLES[selectedBooking.status]
              )}
            >
              {selectedBooking.status.replace("_", " ")}
            </span>
            {selectedBooking.notes && (
              <p className="italic text-muted-foreground">{selectedBooking.notes}</p>
            )}
          </div>
          {selectedBooking.status !== "cancelled" &&
            selectedBooking.status !== "completed" &&
            selectedBooking.status !== "no_show" && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {selectedBooking.status === "pending" && (
                  <Button
                    variant="outline"
                    disabled={updating}
                    onClick={() => updateStatus(selectedBooking.id, "confirmed")}
                    className="h-11"
                  >
                    Confirm
                  </Button>
                )}
                <Button
                  disabled={updating}
                  onClick={() => updateStatus(selectedBooking.id, "completed")}
                  className="h-11"
                >
                  Complete
                </Button>
                <Button
                  variant="outline"
                  disabled={updating}
                  onClick={() => updateStatus(selectedBooking.id, "no_show")}
                  className="h-11 text-orange-400"
                >
                  No-show
                </Button>
                <Button
                  variant="ghost"
                  disabled={updating}
                  onClick={() => updateStatus(selectedBooking.id, "cancelled")}
                  className="h-11 text-red-400"
                >
                  Cancel
                </Button>
              </div>
            )}
        </DetailModal>
      )}

      {selectedBlock && (
        <DetailModal onClose={() => setSelectedBlock(null)} title="Blocked time">
          <div className="space-y-2 text-sm">
            <p className="font-semibold">{selectedBlock.reason || "Blocked"}</p>
            <p>
              {formatDisplayDate(selectedBlock.date)}
              {selectedBlock.end_date &&
                selectedBlock.end_date !== selectedBlock.date &&
                ` — ${formatDisplayDate(selectedBlock.end_date)}`}
            </p>
            {selectedBlock.time && (
              <p>
                {formatDisplayTime(selectedBlock.time)}
                {selectedBlock.end_time &&
                  ` — ${formatDisplayTime(selectedBlock.end_time)}`}
              </p>
            )}
            <p className="text-muted-foreground">
              Barber:{" "}
              {selectedBlock.barber === "*"
                ? "All"
                : barberName(selectedBlock.barber)}
            </p>
          </div>
        </DetailModal>
      )}
    </div>
  );
}

function DetailModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md border border-border bg-card p-5 pb-safe sm:rounded-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="touch-target">
            <X size={20} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
