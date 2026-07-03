export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

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

export interface ServiceRecord {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  category?: string;
  active: boolean;
  barber_ids: string[];
  sort_order: number;
  created_at: string;
}

export interface ServiceInput {
  id?: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  category?: string;
  active?: boolean;
  barber_ids?: string[];
  sort_order?: number;
}

export interface CustomerRecord {
  id: string;
  phone: string;
  name: string;
  email?: string;
  notes?: string;
  favourite_barber?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  phone: string;
  name: string;
  email?: string;
  notes?: string;
  favourite_barber?: string;
}

export interface DashboardStats {
  earned_today: number;
  earned_this_week: number;
  earned_this_month: number;
  average_booking_value: number;
  completed_bookings: number;
  upcoming_bookings: number;
  cancellations: number;
  no_shows: number;
}

/** @deprecated Use ServiceRecord from API */
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
