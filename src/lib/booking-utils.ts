import { OPENING_HOURS, SLOT_INTERVAL_MINUTES } from "@/lib/constants";
import type { BlockedSlot } from "@/types/booking";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function parseTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function getDayName(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return DAY_NAMES[date.getDay()];
}

export function isShopOpenOnDate(dateStr: string): boolean {
  const dayName = getDayName(dateStr);
  const hours = OPENING_HOURS.find((h) => h.day === dayName);
  return Boolean(hours?.open && hours?.close);
}

export function getAvailableSlots(dateStr: string): string[] {
  const dayName = getDayName(dateStr);
  const hours = OPENING_HOURS.find((h) => h.day === dayName);

  if (!hours?.open || !hours?.close) return [];

  const openMinutes = parseTime(hours.open);
  const closeMinutes = parseTime(hours.close);
  const slots: string[] = [];

  for (
    let minutes = openMinutes;
    minutes < closeMinutes;
    minutes += SLOT_INTERVAL_MINUTES
  ) {
    slots.push(formatTime(minutes));
  }

  return slots;
}

export function getSlotsNeeded(durationMinutes: number): number {
  return Math.ceil(durationMinutes / SLOT_INTERVAL_MINUTES);
}

export function getConsecutiveSlots(
  startTime: string,
  count: number,
  allSlots: string[]
): string[] {
  const startIndex = allSlots.indexOf(startTime);
  if (startIndex === -1) return [];
  return allSlots.slice(startIndex, startIndex + count);
}

export function isDateInPast(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T00:00:00");
  return date < today;
}

export function getNextAvailableDates(count: number = 14): string[] {
  const dates: string[] = [];
  const current = new Date();
  current.setHours(12, 0, 0, 0);

  while (dates.length < count) {
    const dateStr = current.toISOString().split("T")[0];
    if (isShopOpenOnDate(dateStr) && !isDateInPast(dateStr)) {
      dates.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDisplayTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")}${period}`;
}

export function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

export function filterPastSlots(dateStr: string, slots: string[]): string[] {
  if (!isToday(dateStr)) return slots;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return slots.filter((slot) => {
    const [h, m] = slot.split(":").map(Number);
    return h * 60 + m > currentMinutes;
  });
}

function isDateInRange(date: string, start: string, end?: string): boolean {
  if (!end) return date === start;
  return date >= start && date <= end;
}

function barberMatches(blockBarber: string, barber: string): boolean {
  return blockBarber === "*" || blockBarber === barber;
}

export function isDateFullyBlocked(
  barber: string,
  date: string,
  blocked: BlockedSlot[]
): boolean {
  return blocked.some(
    (b) =>
      barberMatches(b.barber, barber) &&
      isDateInRange(date, b.date, b.end_date) &&
      !b.time
  );
}

export function isSlotBlocked(
  barber: string,
  date: string,
  time: string,
  blocked: BlockedSlot[]
): boolean {
  if (isDateFullyBlocked(barber, date, blocked)) return true;

  const timeMinutes = parseTime(time);

  return blocked.some((b) => {
    if (!barberMatches(b.barber, barber)) return false;
    if (!isDateInRange(date, b.date, b.end_date)) return false;
    if (!b.time) return true;

    const start = parseTime(b.time);
    const end = b.end_time ? parseTime(b.end_time) : start + SLOT_INTERVAL_MINUTES;

    return timeMinutes >= start && timeMinutes < end;
  });
}

export function getBlockedTimesForDate(
  barber: string,
  date: string,
  blocked: BlockedSlot[],
  allSlots: string[]
): string[] {
  if (isDateFullyBlocked(barber, date, blocked)) return allSlots;

  return allSlots.filter((slot) => isSlotBlocked(barber, date, slot, blocked));
}

export function canBookServiceAtTime(
  durationMinutes: number,
  startTime: string,
  date: string,
  barber: string,
  bookedSlots: string[],
  blocked: BlockedSlot[]
): boolean {
  const allSlots = getAvailableSlots(date);
  const needed = getSlotsNeeded(durationMinutes);
  const consecutive = getConsecutiveSlots(startTime, needed, allSlots);

  if (consecutive.length < needed) return false;

  return consecutive.every(
    (slot) =>
      !bookedSlots.includes(slot) &&
      !isSlotBlocked(barber, date, slot, blocked)
  );
}

export function getOccupiedSlotsForBooking(
  durationMinutes: number,
  startTime: string,
  date: string
): string[] {
  const allSlots = getAvailableSlots(date);
  const needed = getSlotsNeeded(durationMinutes);
  return getConsecutiveSlots(startTime, needed, allSlots);
}
