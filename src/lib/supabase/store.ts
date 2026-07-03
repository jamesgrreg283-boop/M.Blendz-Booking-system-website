import {
  buildCustomerWithStats,
  normalizePhone,
  phonesMatch,
  type CustomerWithStats,
} from "@/lib/customer-utils";
import type {
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
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  type AppStore,
} from "./client";
import { localBookingStore } from "./local-store";

async function getStore(): Promise<AppStore> {
  if (isSupabaseConfigured) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      return createSupabaseStore(supabase);
    }
  }
  return localBookingStore;
}

function mapService(row: Record<string, unknown>): ServiceRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    price: Number(row.price),
    duration: Number(row.duration),
    description: (row.description as string) ?? "",
    category: (row.category as string) ?? "Services",
    active: row.active !== false,
    barber_ids: (row.barber_ids as string[]) ?? [],
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at as string,
  };
}

function mapCustomer(row: Record<string, unknown>): CustomerRecord {
  return {
    id: row.id as string,
    phone: row.phone as string,
    name: row.name as string,
    email: (row.email as string) ?? "",
    notes: (row.notes as string) ?? "",
    favourite_barber: row.favourite_barber as string | undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function createSupabaseStore(
  supabase: NonNullable<ReturnType<typeof createSupabaseServerClient>>
): AppStore {
  async function getServiceDuration(serviceId: string): Promise<number> {
    const { data } = await supabase
      .from("services")
      .select("duration")
      .eq("id", serviceId)
      .eq("active", true)
      .single();
    return data?.duration ?? 15;
  }

  async function syncCustomerFromBooking(booking: Booking): Promise<void> {
    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", booking.phone)
      .maybeSingle();

    const now = new Date().toISOString();

    if (existing) {
      await supabase
        .from("customers")
        .update({
          name: booking.customer_name,
          email: booking.email || existing.email,
          favourite_barber:
            booking.status === "completed"
              ? booking.barber
              : existing.favourite_barber,
          updated_at: now,
        })
        .eq("id", existing.id);
      return;
    }

    await supabase.from("customers").insert({
      phone: booking.phone,
      name: booking.customer_name,
      email: booking.email || "",
      favourite_barber:
        booking.status === "completed" ? booking.barber : null,
      updated_at: now,
    });
  }

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
      const booking = data as Booking;
      await syncCustomerFromBooking(booking);
      return booking;
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
      const booking = data as Booking;
      await syncCustomerFromBooking(booking);
      return booking;
    },

    async getBookedSlots(barber: string, date: string): Promise<string[]> {
      const { data, error } = await supabase
        .from("bookings")
        .select("service, time, status")
        .eq("barber", barber)
        .eq("date", date)
        .in("status", ["pending", "confirmed", "completed"]);

      if (error) return [];

      const { getOccupiedSlotsForBooking } = await import(
        "@/lib/booking-utils"
      );
      const occupied = new Set<string>();

      for (const row of data ?? []) {
        const duration = await getServiceDuration(row.service);
        const slots = getOccupiedSlotsForBooking(
          duration,
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

    async getServices(activeOnly = false): Promise<ServiceRecord[]> {
      let query = supabase
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true });

      if (activeOnly) query = query.eq("active", true);

      const { data, error } = await query;
      if (error) return [];
      return (data ?? []).map(mapService);
    },

    async getServiceById(id: string): Promise<ServiceRecord | null> {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return null;
      return mapService(data);
    },

    async createService(input: ServiceInput): Promise<ServiceRecord> {
      const id =
        input.id?.trim() ||
        `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

      const { data, error } = await supabase
        .from("services")
        .insert({
          id,
          name: input.name,
          price: input.price,
          duration: input.duration,
          description: input.description ?? "",
          category: input.category ?? "Services",
          active: input.active ?? true,
          barber_ids: input.barber_ids ?? ["m-blendz"],
          sort_order: input.sort_order ?? 99,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapService(data);
    },

    async updateService(id: string, input: Partial<ServiceInput>) {
      const { data, error } = await supabase
        .from("services")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) return null;
      return mapService(data);
    },

    async deleteService(id: string): Promise<boolean> {
      const { error } = await supabase
        .from("services")
        .update({ active: false })
        .eq("id", id);

      return !error;
    },

    async getCustomers(): Promise<CustomerWithStats[]> {
      const [bookings, serviceList, { data: customerRows }] =
        await Promise.all([
          this.getAll(),
          this.getServices(),
          supabase.from("customers").select("*"),
        ]);

      const records = (customerRows ?? []).map(mapCustomer);
      const phoneSet = new Set<string>();
      for (const b of bookings) phoneSet.add(normalizePhone(b.phone));
      for (const c of records) phoneSet.add(normalizePhone(c.phone));

      const result: CustomerWithStats[] = [];

      for (const phoneKey of phoneSet) {
        if (!phoneKey) continue;
        const record =
          records.find((c) => normalizePhone(c.phone) === phoneKey) ??
          (() => {
            const b = bookings.find(
              (bk) => normalizePhone(bk.phone) === phoneKey
            );
            if (!b) return null;
            return {
              id: `derived-${phoneKey}`,
              phone: b.phone,
              name: b.customer_name,
              email: b.email,
              notes: "",
              created_at: b.created_at,
              updated_at: b.created_at,
            } satisfies CustomerRecord;
          })();

        if (!record) continue;
        result.push(
          buildCustomerWithStats(record, bookings, serviceList)
        );
      }

      return result.sort((a, b) => b.visit_count - a.visit_count);
    },

    async getCustomerByPhone(phone: string): Promise<CustomerWithStats | null> {
      const all = await this.getCustomers();
      return all.find((c) => phonesMatch(c.phone, phone)) ?? null;
    },

    async upsertCustomer(input: CustomerInput): Promise<CustomerRecord> {
      const { data: existing } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", input.phone)
        .maybeSingle();

      const now = new Date().toISOString();

      if (existing) {
        const { data, error } = await supabase
          .from("customers")
          .update({
            name: input.name,
            email: input.email ?? existing.email,
            notes: input.notes ?? existing.notes,
            favourite_barber:
              input.favourite_barber ?? existing.favourite_barber,
            updated_at: now,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return mapCustomer(data);
      }

      const { data, error } = await supabase
        .from("customers")
        .insert({
          phone: input.phone,
          name: input.name,
          email: input.email ?? "",
          notes: input.notes ?? "",
          favourite_barber: input.favourite_barber ?? null,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapCustomer(data);
    },

    async updateCustomer(id: string, input: Partial<CustomerInput>) {
      const { data, error } = await supabase
        .from("customers")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) return null;
      return mapCustomer(data);
    },

    async getDashboardStats(): Promise<DashboardStats> {
      const bookings = await this.getAll();
      const services = await this.getServices();
      const serviceMap = new Map(services.map((s) => [s.id, s]));
      const price = (b: Booking) => serviceMap.get(b.service)?.price ?? 0;

      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1);
      if (now.getDay() === 0) weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = weekStart.toISOString().split("T")[0];
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const completed = bookings.filter((b) => b.status === "completed");
      const upcoming = bookings.filter(
        (b) =>
          b.date >= today &&
          (b.status === "pending" || b.status === "confirmed")
      );

      return {
        earned_today: completed
          .filter((b) => b.date === today)
          .reduce((s, b) => s + price(b), 0),
        earned_this_week: completed
          .filter((b) => b.date >= weekStartStr)
          .reduce((s, b) => s + price(b), 0),
        earned_this_month: completed
          .filter((b) => b.date >= monthStart)
          .reduce((s, b) => s + price(b), 0),
        average_booking_value:
          completed.length > 0
            ? completed.reduce((s, b) => s + price(b), 0) / completed.length
            : 0,
        completed_bookings: completed.length,
        upcoming_bookings: upcoming.length,
        cancellations: bookings.filter((b) => b.status === "cancelled").length,
        no_shows: bookings.filter((b) => b.status === "no_show").length,
      };
    },
  };
}

export { getStore };
