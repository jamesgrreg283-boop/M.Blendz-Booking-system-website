import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getStore } from "@/lib/supabase/store";
import type { ServiceInput } from "@/types/booking";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const store = await getStore();
    const services = await store.getServices(false);
    return NextResponse.json(services);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ServiceInput;
    if (!body.name || body.price == null || !body.duration) {
      return NextResponse.json(
        { error: "name, price, and duration are required" },
        { status: 400 }
      );
    }

    const store = await getStore();
    const service = await store.createService(body);
    return NextResponse.json(service, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create service" },
      { status: 500 }
    );
  }
}
