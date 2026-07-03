import {
  buildCustomerWithStats,
  normalizePhone,
  phonesMatch,
  type CustomerWithStats,
} from "@/lib/customer-utils";
import { getOccupiedSlotsForBooking } from "@/lib/booking-utils";
import { DEFAULT_SERVICES } from "@/lib/seed/services";
import type {
  BlockedSlot,
  BlockedSlotInput,
  Booking,
  BookingInput,
  BookingStatus,
  CustomerInput,
  CustomerRecord,
  DashboardStats,
  ServiceInput,
  ServiceRecord,
} from "@/types/booking";
import type { AppStore } from "./client";

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
const services: ServiceRecord[] = DEFAULT_SERVICES.map((s) => ({ ...s }));
const customers: CustomerRecord[] = [];

function isSlotOccupyingStatus(status: BookingStatus): boolean {
  return status !== "cancelled" && status !== "no_show";
}

async function getServiceDuration(serviceId: string): Promise<number> {
  const service = services.find((s) => s.id === serviceId && s.active);
  return service?.duration ?? 15;
}

function getOccupiedFromBookings(
  barber: string,
  date: string,
  excludeId?: string
): string[] {
  const occupied = new Set<string>();

  for (const booking of bookings) {
    if (booking.id === excludeId || !isSlotOccupyingStatus(booking.status))
      continue;
    if (booking.barber !== barber || booking.date !== date) continue;

    const duration = services.find((s) => s.id === booking.service)?.duration ?? 15;
    const slots = getOccupiedSlotsForBooking(duration, booking.time, booking.date);
    slots.forEach((s) => occupied.add(s));
  }

  return [...occupied];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function syncCustomerFromBooking(booking: Booking): void {
  const normalized = normalizePhone(booking.phone);
  if (!normalized) return;

  const existing = customers.find((c) => phonesMatch(c.phone, booking.phone));
  const now = new Date().toISOString();

  if (existing) {
    existing.name = booking.customer_name;
    existing.email = booking.email || existing.email;
    existing.updated_at = now;
    if (booking.status === "completed") {
      existing.favourite_barber = booking.barber;
    }
    return;
  }

  customers.push({
    id: crypto.randomUUID(),
    phone: booking.phone,
    name: booking.customer_name,
    email: booking.email || "",
    notes: "",
    favourite_barber:
      booking.status === "completed" ? booking.barber : undefined,
    created_at: now,
    updated_at: now,
  });
}

function computeStats(): DashboardStats {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  if (now.getDay() === 0) weekStart.setDate(weekStart.getDate() - 7);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const price = (b: Booking) => serviceMap.get(b.service)?.price ?? 0;

  const completed = bookings.filter((b) => b.status === "completed");
  const earnedToday = completed
    .filter((b) => b.date === today)
    .reduce((s, b) => s + price(b), 0);
  const earnedWeek = completed
    .filter((b) => b.date >= weekStartStr)
    .reduce((s, b) => s + price(b), 0);
  const earnedMonth = completed
    .filter((b) => b.date >= monthStart)
    .reduce((s, b) => s + price(b), 0);

  const upcoming = bookings.filter(
    (b) =>
      b.date >= today &&
      (b.status === "pending" || b.status === "confirmed")
  );

  return {
    earned_today: earnedToday,
    earned_this_week: earnedWeek,
    earned_this_month: earnedMonth,
    average_booking_value:
      completed.length > 0
        ? completed.reduce((s, b) => s + price(b), 0) / completed.length
        : 0,
    completed_bookings: completed.length,
    upcoming_bookings: upcoming.length,
    cancellations: bookings.filter((b) => b.status === "cancelled").length,
    no_shows: bookings.filter((b) => b.status === "no_show").length,
  };
}

export const localBookingStore: AppStore = {
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
    syncCustomerFromBooking(booking);
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
    syncCustomerFromBooking(bookings[index]);
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

    const duration = await getServiceDuration(serviceId);
    return canBookServiceAtTime(
      duration,
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

  async getServices(activeOnly = false): Promise<ServiceRecord[]> {
    const list = [...services].sort((a, b) => a.sort_order - b.sort_order);
    return activeOnly ? list.filter((s) => s.active) : list;
  },

  async getServiceById(id: string): Promise<ServiceRecord | null> {
    return services.find((s) => s.id === id) ?? null;
  },

  async createService(input: ServiceInput): Promise<ServiceRecord> {
    const id =
      input.id?.trim() ||
      `${slugify(input.name)}-${crypto.randomUUID().slice(0, 6)}`;
    if (services.some((s) => s.id === id)) {
      throw new Error("A service with this ID already exists.");
    }
    const record: ServiceRecord = {
      id,
      name: input.name,
      price: input.price,
      duration: input.duration,
      description: input.description ?? "",
      category: input.category ?? "Services",
      active: input.active ?? true,
      barber_ids: input.barber_ids ?? ["m-blendz"],
      sort_order: input.sort_order ?? services.length + 1,
      created_at: new Date().toISOString(),
    };
    services.push(record);
    return record;
  },

  async updateService(
    id: string,
    input: Partial<ServiceInput>
  ): Promise<ServiceRecord | null> {
    const index = services.findIndex((s) => s.id === id);
    if (index === -1) return null;
    services[index] = {
      ...services[index],
      ...input,
      barber_ids: input.barber_ids ?? services[index].barber_ids,
    };
    return services[index];
  },

  async deleteService(id: string): Promise<boolean> {
    const index = services.findIndex((s) => s.id === id);
    if (index === -1) return false;
    services[index] = { ...services[index], active: false };
    return true;
  },

  async getCustomers(): Promise<CustomerWithStats[]> {
    const allBookings = await this.getAll();
    const allServices = await this.getServices();

    const phoneSet = new Set<string>();
    for (const b of allBookings) phoneSet.add(normalizePhone(b.phone));
    for (const c of customers) phoneSet.add(normalizePhone(c.phone));

    const result: CustomerWithStats[] = [];

    for (const phoneKey of phoneSet) {
      if (!phoneKey) continue;
      const record =
        customers.find((c) => normalizePhone(c.phone) === phoneKey) ??
        (() => {
          const b = allBookings.find(
            (bk) => normalizePhone(bk.phone) === phoneKey
          );
          if (!b) return null;
          return {
            id: `derived-${phoneKey}`,
            phone: b.phone,
            name: b.customer_name,
            email: b.email,
            notes: "",
            favourite_barber: undefined,
            created_at: b.created_at,
            updated_at: b.created_at,
          } satisfies CustomerRecord;
        })();

      if (!record) continue;
      result.push(buildCustomerWithStats(record, allBookings, allServices));
    }

    return result.sort((a, b) => b.visit_count - a.visit_count);
  },

  async getCustomerByPhone(phone: string): Promise<CustomerWithStats | null> {
    const all = await this.getCustomers();
    return all.find((c) => phonesMatch(c.phone, phone)) ?? null;
  },

  async upsertCustomer(input: CustomerInput): Promise<CustomerRecord> {
    const existing = customers.find((c) => phonesMatch(c.phone, input.phone));
    const now = new Date().toISOString();

    if (existing) {
      existing.name = input.name;
      existing.email = input.email ?? existing.email;
      existing.notes = input.notes ?? existing.notes;
      existing.favourite_barber =
        input.favourite_barber ?? existing.favourite_barber;
      existing.updated_at = now;
      return existing;
    }

    const record: CustomerRecord = {
      id: crypto.randomUUID(),
      phone: input.phone,
      name: input.name,
      email: input.email ?? "",
      notes: input.notes ?? "",
      favourite_barber: input.favourite_barber,
      created_at: now,
      updated_at: now,
    };
    customers.push(record);
    return record;
  },

  async updateCustomer(
    id: string,
    input: Partial<CustomerInput>
  ): Promise<CustomerRecord | null> {
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return null;
    customers[index] = {
      ...customers[index],
      ...input,
      updated_at: new Date().toISOString(),
    };
    return customers[index];
  },

  async getDashboardStats(): Promise<DashboardStats> {
    return computeStats();
  },
};
