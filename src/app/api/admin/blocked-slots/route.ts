import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getStore } from "@/lib/supabase/store";
import type { BlockedSlotInput } from "@/types/booking";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const store = await getStore();
    const blocked = await store.getBlockedSlots();
    return NextResponse.json(blocked);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch blocked slots" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as BlockedSlotInput;

    if (!body.date || !body.barber) {
      return NextResponse.json(
        { error: "date and barber are required" },
        { status: 400 }
      );
    }

    const store = await getStore();
    const block = await store.createBlockedSlot(body);
    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create block";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
