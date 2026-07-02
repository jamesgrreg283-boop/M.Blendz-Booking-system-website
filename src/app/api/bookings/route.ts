import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getStore } from "@/lib/supabase/store";
import type { BookingInput } from "@/types/booking";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const store = await getStore();
    const bookings = await store.getAll();
    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BookingInput;

    if (
      !body.customer_name ||
      !body.phone ||
      !body.service ||
      !body.barber ||
      !body.date ||
      !body.time
    ) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    const store = await getStore();
    const booking = await store.create({
      ...body,
      email: body.email || "",
      source: "online",
    });
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create booking";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
