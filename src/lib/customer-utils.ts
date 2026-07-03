import type { Booking, CustomerRecord, ServiceRecord } from "@/types/booking";

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  return na === nb || na.endsWith(nb) || nb.endsWith(na);
}

export interface CustomerStats {
  visit_count: number;
  total_spent: number;
  last_service: string | null;
  last_visit_date: string | null;
  no_show_count: number;
  last_no_show_date: string | null;
  cancelled_count: number;
  is_repeat_offender: boolean;
}

export function computeCustomerStats(
  phone: string,
  bookings: Booking[],
  services: ServiceRecord[]
): CustomerStats {
  const mine = bookings.filter((b) => phonesMatch(b.phone, phone));
  const completed = mine.filter((b) => b.status === "completed");
  const noShows = mine.filter((b) => b.status === "no_show");
  const cancelled = mine.filter((b) => b.status === "cancelled");

  const serviceMap = new Map(services.map((s) => [s.id, s]));

  const totalSpent = completed.reduce((sum, b) => {
    const svc = serviceMap.get(b.service);
    return sum + (svc?.price ?? 0);
  }, 0);

  const sortedCompleted = [...completed].sort((a, b) =>
    `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)
  );
  const last = sortedCompleted[0];

  const sortedNoShows = [...noShows].sort((a, b) =>
    `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)
  );

  const noShowCount = noShows.length;

  return {
    visit_count: completed.length,
    total_spent: totalSpent,
    last_service: last
      ? serviceMap.get(last.service)?.name ?? last.service
      : null,
    last_visit_date: last?.date ?? null,
    no_show_count: noShowCount,
    last_no_show_date: sortedNoShows[0]?.date ?? null,
    cancelled_count: cancelled.length,
    is_repeat_offender: noShowCount >= 2,
  };
}

export type CustomerWithStats = CustomerRecord & CustomerStats;

export function buildCustomerWithStats(
  record: CustomerRecord,
  bookings: Booking[],
  services: ServiceRecord[]
): CustomerWithStats {
  return {
    ...record,
    ...computeCustomerStats(record.phone, bookings, services),
  };
}
