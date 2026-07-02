import type {
  BlockedSlotInput,
  Booking,
  BookingInput,
  BookingStatus,
} from "@/types/booking";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  type BookingStore,
} from "./client";
import { localBookingStore } from "./local-store";

async function getStore(): Promise<BookingStore> {
  if (isSupabaseConfigured) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      return createSupabaseStore(supabase);
    }
  }
  return localBookingStore;
}

function createSupabaseStore(
  supabase: NonNullable<ReturnType<typeof createSupabaseServerClient>>
): BookingStore {
  return {
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

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          ...input,
          status: input.status ?? "pending",
          source: input.source ?? "online",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Booking;
    },

    async getAll(): Promise<Booking[]> {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as Booking[];
    },

    async getById(id: string): Promise<Booking | null> {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return null;
      return data as Booking;
    },

    async updateStatus(
      id: string,
      status: BookingStatus
    ): Promise<Booking | null> {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) return null;
      return data as Booking;
    },

    async getBookedSlots(barber: string, date: string): Promise<string[]> {
      const { data, error } = await supabase
        .from("bookings")
        .select("service, time")
        .eq("barber", barber)
        .eq("date", date)
        .neq("status", "cancelled");

      if (error) return [];

      const { getOccupiedSlotsForBooking } = await import(
        "@/lib/booking-utils"
      );
      const occupied = new Set<string>();

      for (const row of data ?? []) {
        const slots = getOccupiedSlotsForBooking(
          row.service,
          row.time,
          date
        );
        slots.forEach((s) => occupied.add(s));
      }

      return [...occupied];
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
      const booked = await this.getBookedSlots(barber, date);
      const blocked = await this.getBlockedSlots();

      if (!serviceId) {
        return (
          !booked.includes(time) &&
          !isSlotBlocked(barber, date, time, blocked)
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

    async getBlockedSlots() {
      const { data, error } = await supabase
        .from("blocked_slots")
        .select("*")
        .order("date", { ascending: true });

      if (error) return [];
      return data ?? [];
    },

    async createBlockedSlot(input: BlockedSlotInput) {
      const { data, error } = await supabase
        .from("blocked_slots")
        .insert(input)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    async deleteBlockedSlot(id: string) {
      const { error } = await supabase
        .from("blocked_slots")
        .delete()
        .eq("id", id);

      return !error;
    },
  };
}

export { getStore };
