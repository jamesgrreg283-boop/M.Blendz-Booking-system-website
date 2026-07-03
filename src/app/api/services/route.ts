import { NextResponse } from "next/server";
import { DEFAULT_SERVICES } from "@/lib/seed/services";
import { getStore } from "@/lib/supabase/store";

export async function GET() {
  try {
    const store = await getStore();
    const services = await store.getServices(true);
    const active =
      services.length > 0
        ? services
        : DEFAULT_SERVICES.filter((s) => s.active);
    return NextResponse.json(active);
  } catch {
    return NextResponse.json(DEFAULT_SERVICES.filter((s) => s.active));
  }
}
