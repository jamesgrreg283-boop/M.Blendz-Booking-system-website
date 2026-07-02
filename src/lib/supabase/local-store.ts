import { getOccupiedSlotsForBooking } from "@/lib/booking-utils";
import type {
  BlockedSlot,
  BlockedSlotInput,
  Booking,
  BookingInput,
  BookingStatus,
} from "@/types/booking";
import type { BookingStore } from "./client";

const bookings: Booking[] = [];
const blockedSlots: BlockedSlot[] = [
  {
    id: "holiday-2026",
    barber: "*",
    date: "2026-07-06",
    end_date: "2026-08-07",
    reason: "Holiday",
    created_at: new Date().toISOString(),
  },
];

function getOccupiedFromBookings(
  barber: string,
  date: string,
  excludeId?: string
): string[] {
  const occupied = new Set<string>();

  for (const booking of bookings) {
    if (booking.id === excludeId || booking.status === "cancelled") continue;
    if (booking.barber !== barber || booking.date !== date) continue;

    const slots = getOccupiedSlotsForBooking(
      booking.service,
      booking.time,
      booking.date
    );
    slots.forEach((s) => occupied.add(s));
  }

  return [...occupied];
}

export const localBookingStore: BookingStore = {
  async create(input: BookingInput): Promise<Booking> {
    const available = await this.isSlotAvailable(
      input.barber,
      input.date,
      input.time,
      input.service
    );

    if (!available) {
      throw new Error("This time slot is no longer available.");
    }

    const booking: Booking = {
      id: crypto.randomUUID(),
      customer_name: input.customer_name,
      phone: input.phone,
      email: input.email || "",
      service: input.service,
      barber: input.barber,
      date: input.date,
      time: input.time,
      status: input.status ?? "pending",
      notes: input.notes,
      source: input.source ?? "online",
      created_at: new Date().toISOString(),
    };

    bookings.push(booking);
    return booking;
  },

  async getAll(): Promise<Booking[]> {
    return [...bookings].sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime()
    );
  },

  async getById(id: string): Promise<Booking | null> {
    return bookings.find((b) => b.id === id) ?? null;
  },

  async updateStatus(
    id: string,
    status: BookingStatus
  ): Promise<Booking | null> {
    const index = bookings.findIndex((b) => b.id === id);
    if (index === -1) return null;
    bookings[index] = { ...bookings[index], status };
    return bookings[index];
  },

  async getBookedSlots(barber: string, date: string): Promise<string[]> {
    return getOccupiedFromBookings(barber, date);
  },

  async isSlotAvailable(
    barber: string,
    date: string,
    time: string,
    serviceId?: string
  ): Promise<boolean> {
    const { canBookServiceAtTime, isSlotBlocked } = await import(
      "@/lib/booking-utils"
    );

    const booked = getOccupiedFromBookings(barber, date);
    const blocked = blockedSlots;

    if (!serviceId) {
      return (
        !booked.includes(time) && !isSlotBlocked(barber, date, time, blocked)
      );
    }

    return canBookServiceAtTime(
      serviceId,
      time,
      date,
      barber,
      booked,
      blocked
    );
  },

  async getBlockedSlots(): Promise<BlockedSlot[]> {
    return [...blockedSlots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  },

  async createBlockedSlot(input: BlockedSlotInput): Promise<BlockedSlot> {
    const block: BlockedSlot = {
      id: crypto.randomUUID(),
      ...input,
      created_at: new Date().toISOString(),
    };
    blockedSlots.push(block);
    return block;
  },

  async deleteBlockedSlot(id: string): Promise<boolean> {
    const index = blockedSlots.findIndex((b) => b.id === id);
    if (index === -1) return false;
    blockedSlots.splice(index, 1);
    return true;
  },
};
