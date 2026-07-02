import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminPassword,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!getAdminPassword()) {
    return NextResponse.json(
      { error: "Admin password not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const password = body.password as string;

  if (!password || !verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = createAdminSessionToken();
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });

  return response;
}
