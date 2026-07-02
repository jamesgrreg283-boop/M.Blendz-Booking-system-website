import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "mblendz_admin_session";
const SESSION_HOURS = 12;

function getSecret(): string {
  return process.env.ADMIN_SECRET || "m-blendz-change-in-production";
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

export function createAdminSessionToken(): string {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `admin:${expires}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${expires}.${sig}`;
}

export function verifyAdminSessionToken(token: string): boolean {
  const [expiresStr, sig] = token.split(".");
  if (!expiresStr || !sig) return false;

  const expires = Number(expiresStr);
  if (Number.isNaN(expires) || Date.now() > expires) return false;

  const payload = `admin:${expires}`;
  const expected = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminSessionToken(token);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;

  try {
    return timingSafeEqual(
      Buffer.from(password),
      Buffer.from(expected)
    );
  } catch {
    return password === expected;
  }
}
