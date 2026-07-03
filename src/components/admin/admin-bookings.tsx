"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BARBERS } from "@/lib/constants";
import {
  formatDisplayDate,
  formatDisplayTime,
  isToday,
} from "@/lib/booking-utils";
import type { Booking, BookingStatus } from "@/types/booking";
import { useServices } from "@/hooks/use-services";
import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "./admin-shared";

type ListFilter = "active" | "no_shows";

export function AdminBookings() {
  const { services } = useServices(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<ListFilter>("active");

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

  const serviceName = (id: string) =>
    services.find((s) => s.id === id)?.name ?? id;
  const barberName = (id: string) =>
    BARBERS.find((b) => b.id === id)?.name ?? id;

  const today = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter(
    (b) =>
      b.date === today &&
      b.status !== "cancelled" &&
      b.status !== "no_show"
  );
  const upcomingBookings = bookings.filter(
    (b) =>
      b.date > today &&
      b.status !== "cancelled" &&
      b.status !== "no_show"
  );
  const noShowBookings = bookings.filter((b) => b.status === "no_show");
  const pastBookings = bookings.filter(
    (b) =>
      b.date < today ||
      b.status === "cancelled" ||
      b.status === "completed"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (filter === "no_shows") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">No-shows</h2>
          <Button variant="outline" size="sm" onClick={() => setFilter("active")}>
            Back to bookings
          </Button>
        </div>
        <BookingSection
          title="No-show bookings"
          bookings={noShowBookings}
          emptyMessage="No no-shows recorded."
          updating={updating}
          onUpdateStatus={updateStatus}
          serviceName={serviceName}
          barberName={barberName}
          muted
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Bookings</h2>
        {noShowBookings.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilter("no_shows")}
            className="text-orange-400"
          >
            No-shows ({noShowBookings.length})
          </Button>
        )}
      </div>

      <BookingSection
        title="Today's Bookings"
        bookings={todaysBookings}
        emptyMessage="No bookings for today."
        updating={updating}
        onUpdateStatus={updateStatus}
        serviceName={serviceName}
        barberName={barberName}
      />
      <BookingSection
        title="Upcoming Bookings"
        bookings={upcomingBookings}
        emptyMessage="No upcoming bookings."
        updating={updating}
        onUpdateStatus={updateStatus}
        serviceName={serviceName}
        barberName={barberName}
      />
      {pastBookings.length > 0 && (
        <BookingSection
          title="Past & Completed"
          bookings={pastBookings.slice(-10).reverse()}
          emptyMessage=""
          updating={updating}
          onUpdateStatus={updateStatus}
          serviceName={serviceName}
          barberName={barberName}
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
  serviceName,
  barberName,
  muted,
}: {
  title: string;
  bookings: Booking[];
  emptyMessage: string;
  updating: string | null;
  onUpdateStatus: (id: string, status: BookingStatus) => void;
  serviceName: (id: string) => string;
  barberName: (id: string) => string;
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
              serviceName={serviceName}
              barberName={barberName}
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
  serviceName,
  barberName,
  muted,
}: {
  booking: Booking;
  updating: boolean;
  onUpdateStatus: (id: string, status: BookingStatus) => void;
  serviceName: (id: string) => string;
  barberName: (id: string) => string;
  muted?: boolean;
}) {
  const canAct =
    !muted &&
    booking.status !== "cancelled" &&
    booking.status !== "completed" &&
    booking.status !== "no_show";

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
              {booking.status.replace("_", " ")}
            </span>
            {booking.source === "manual" && (
              <span className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Manual
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {serviceName(booking.service)} &middot; {barberName(booking.barber)}
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

        {canAct && (
          <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
            {booking.status === "pending" && (
              <Button
                size="lg"
                variant="outline"
                disabled={updating}
                onClick={() => onUpdateStatus(booking.id, "confirmed")}
                className="h-11 w-full sm:h-9"
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
                className="h-11 w-full sm:h-9"
              >
                Complete
              </Button>
            )}
            {(booking.status === "pending" ||
              booking.status === "confirmed") && (
              <Button
                size="lg"
                variant="outline"
                disabled={updating}
                onClick={() => onUpdateStatus(booking.id, "no_show")}
                className="h-11 w-full text-orange-400 sm:h-9"
              >
                No-show
              </Button>
            )}
            <Button
              size="lg"
              variant="ghost"
              disabled={updating}
              onClick={() => onUpdateStatus(booking.id, "cancelled")}
              className="col-span-2 h-11 w-full text-red-400 hover:text-red-300 sm:col-span-1 sm:h-9"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
