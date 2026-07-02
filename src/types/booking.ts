export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  service: string;
  barber: string;
  date: string;
  time: string;
  status: BookingStatus;
  created_at: string;
  notes?: string;
  source?: "online" | "manual";
}

export interface BookingInput {
  customer_name: string;
  phone: string;
  email: string;
  service: string;
  barber: string;
  date: string;
  time: string;
  notes?: string;
  status?: BookingStatus;
  source?: "online" | "manual";
}

export interface BlockedSlot {
  id: string;
  barber: string;
  date: string;
  end_date?: string;
  time?: string;
  end_time?: string;
  reason?: string;
  created_at: string;
}

export interface BlockedSlotInput {
  barber: string;
  date: string;
  end_date?: string;
  time?: string;
  end_time?: string;
  reason?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category?: string;
}

export interface Barber {
  id: string;
  name: string;
  role: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
}

export interface OpeningHours {
  day: string;
  open: string | null;
  close: string | null;
}
