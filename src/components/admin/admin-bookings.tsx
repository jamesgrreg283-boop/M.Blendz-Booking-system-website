"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SERVICES, BARBERS } from "@/lib/constants";
import {
  formatDisplayDate,
  formatDisplayTime,
  isToday,
} from "@/lib/booking-utils";
import type { Booking, BookingStatus } from "@/types/booking";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        setBookings(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      }
    } finally {
      setUpdating(null);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter(
    (b) => b.date === today && b.status !== "cancelled"
  );
  const upcomingBookings = bookings.filter(
    (b) => b.date > today && b.status !== "cancelled"
  );
  const pastBookings = bookings.filter(
    (b) => b.date < today || b.status === "cancelled"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <BookingSection
        title="Today's Bookings"
        bookings={todaysBookings}
        emptyMessage="No bookings for today."
        updating={updating}
        onUpdateStatus={updateStatus}
      />
      <BookingSection
        title="Upcoming Bookings"
        bookings={upcomingBookings}
        emptyMessage="No upcoming bookings."
        updating={updating}
        onUpdateStatus={updateStatus}
      />
      {pastBookings.length > 0 && (
        <BookingSection
          title="Past & Cancelled"
          bookings={pastBookings.slice(-10).reverse()}
          emptyMessage=""
          updating={updating}
          onUpdateStatus={updateStatus}
          muted
        />
      )}
    </div>
  );
}

function BookingSection({
  title,
  bookings,
  emptyMessage,
  updating,
  onUpdateStatus,
  muted,
}: {
  title: string;
  bookings: Booking[];
  emptyMessage: string;
  updating: string | null;
  onUpdateStatus: (id: string, status: BookingStatus) => void;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl">{title}</h2>
      {bookings.length === 0 ? (
        <p className="text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              updating={updating === booking.id}
              onUpdateStatus={onUpdateStatus}
              muted={muted}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BookingCard({
  booking,
  updating,
  onUpdateStatus,
  muted,
}: {
  booking: Booking;
  updating: boolean;
  onUpdateStatus: (id: string, status: BookingStatus) => void;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "border border-border bg-card p-4 sm:p-5",
        muted && "opacity-60"
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-foreground">
              {booking.customer_name}
            </p>
            <span
              className={cn(
                "rounded-sm border px-2 py-0.5 text-xs font-medium capitalize",
                STATUS_STYLES[booking.status]
              )}
            >
              {booking.status}
            </span>
            {booking.source === "manual" && (
              <span className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Manual
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {SERVICES.find((s) => s.id === booking.service)?.name ??
              booking.service}{" "}
            &middot;{" "}
            {BARBERS.find((b) => b.id === booking.barber)?.name ??
              booking.barber}
          </p>
          <p className="text-sm">
            {isToday(booking.date)
              ? "Today"
              : formatDisplayDate(booking.date)}{" "}
            at {formatDisplayTime(booking.time)}
          </p>
          <a
            href={`tel:${booking.phone}`}
            className="inline-flex min-h-11 items-center text-base font-medium text-primary active:opacity-80"
          >
            {booking.phone}
          </a>
          {booking.email && (
            <p className="text-sm text-muted-foreground">{booking.email}</p>
          )}
          {booking.notes && (
            <p className="text-sm italic text-muted-foreground">
              Note: {booking.notes}
            </p>
          )}
        </div>

        {!muted &&
          booking.status !== "cancelled" &&
          booking.status !== "completed" && (
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 sm:flex sm:flex-wrap">
              {booking.status === "pending" && (
                <Button
                  size="lg"
                  variant="outline"
                  disabled={updating}
                  onClick={() => onUpdateStatus(booking.id, "confirmed")}
                  className="h-11 w-full sm:h-9 sm:w-auto"
                >
                  Confirm
                </Button>
              )}
              {(booking.status === "pending" ||
                booking.status === "confirmed") && (
                <Button
                  size="lg"
                  disabled={updating}
                  onClick={() => onUpdateStatus(booking.id, "completed")}
                  className="h-11 w-full sm:h-9 sm:w-auto"
                >
                  Complete
                </Button>
              )}
              <Button
                size="lg"
                variant="ghost"
                disabled={updating}
                onClick={() => onUpdateStatus(booking.id, "cancelled")}
                className="col-span-2 h-11 w-full text-red-400 hover:text-red-300 sm:col-span-1 sm:h-9 sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
