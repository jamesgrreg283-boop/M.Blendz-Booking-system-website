import { NextResponse } from "next/server";
import { getStore } from "@/lib/supabase/store";

export async function GET() {
  try {
    const store = await getStore();
    const services = await store.getServices(true);
    return NextResponse.json(services);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
