import { NextResponse } from "next/server";
import { getStore } from "@/lib/supabase/store";
import {
  filterPastSlots,
  getAvailableSlots,
  getBlockedTimesForDate,
  getSlotsNeeded,
  isDateFullyBlocked,
  isShopOpenOnDate,
} from "@/lib/booking-utils";
import { getServiceById } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barber = searchParams.get("barber");
  const date = searchParams.get("date");
  const serviceId = searchParams.get("service");

  if (!barber || !date) {
    return NextResponse.json(
      { error: "barber and date are required" },
      { status: 400 }
    );
  }

  if (!isShopOpenOnDate(date)) {
    return NextResponse.json({ slots: [] });
  }

  try {
    const store = await getStore();
    const blocked = await store.getBlockedSlots();

    if (isDateFullyBlocked(barber, date, blocked)) {
      return NextResponse.json({ slots: [] });
    }

    const allSlots = getAvailableSlots(date);
    const availableSlots = filterPastSlots(date, allSlots);
    const bookedSlots = await store.getBookedSlots(barber, date);
    const blockedTimes = getBlockedTimesForDate(
      barber,
      date,
      blocked,
      allSlots
    );
    const unavailable = new Set([...bookedSlots, ...blockedTimes]);

    let slots = availableSlots.filter((s) => !unavailable.has(s));

    if (serviceId) {
      const service = getServiceById(serviceId);
      if (service) {
        const needed = getSlotsNeeded(service.duration);
        slots = slots.filter((startSlot) => {
          const startIndex = availableSlots.indexOf(startSlot);
          if (startIndex === -1) return false;
          const consecutive = availableSlots.slice(
            startIndex,
            startIndex + needed
          );
          if (consecutive.length < needed) return false;
          return consecutive.every((s) => !unavailable.has(s));
        });
      }
    }

    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch slots" },
      { status: 500 }
    );
  }
}
