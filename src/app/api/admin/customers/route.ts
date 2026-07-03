import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getStore } from "@/lib/supabase/store";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    const store = await getStore();

    if (phone) {
      const customer = await store.getCustomerByPhone(phone);
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
      return NextResponse.json(customer);
    }

    const customers = await store.getCustomers();
    return NextResponse.json(customers);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
