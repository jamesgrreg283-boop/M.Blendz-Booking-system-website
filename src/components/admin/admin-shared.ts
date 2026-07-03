import type { BookingStatus } from "@/types/booking";

export const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  no_show: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export function formatMoney(amount: number): string {
  return `£${amount.toFixed(0)}`;
}

export function formatMoneyDecimal(amount: number): string {
  return `£${amount.toFixed(2)}`;
}
