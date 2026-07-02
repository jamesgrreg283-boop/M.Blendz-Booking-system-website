import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  BlockedSlot,
  BlockedSlotInput,
  Booking,
  BookingInput,
  BookingStatus,
} from "@/types/booking";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function createSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(supabaseUrl!, supabaseAnonKey!);
}

export function createSupabaseServerClient(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey);
}

export interface BookingStore {
  create(input: BookingInput): Promise<Booking>;
  getAll(): Promise<Booking[]>;
  getById(id: string): Promise<Booking | null>;
  updateStatus(id: string, status: BookingStatus): Promise<Booking | null>;
  getBookedSlots(barber: string, date: string): Promise<string[]>;
  isSlotAvailable(
    barber: string,
    date: string,
    time: string,
    serviceId?: string
  ): Promise<boolean>;
  getBlockedSlots(): Promise<BlockedSlot[]>;
  createBlockedSlot(input: BlockedSlotInput): Promise<BlockedSlot>;
  deleteBlockedSlot(id: string): Promise<boolean>;
}
