import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getStore } from "@/lib/supabase/store";
import type { BookingStatus } from "@/types/booking";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const status = body.status as BookingStatus;

    if (!["confirmed", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const store = await getStore();
    const booking = await store.updateStatus(id, status);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch {
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
