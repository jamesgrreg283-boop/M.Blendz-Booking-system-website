"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, TrendingUp, Calendar, CheckCircle, XCircle, UserX } from "lucide-react";
import type { DashboardStats } from "@/types/booking";
import { formatMoney, formatMoneyDecimal } from "./admin-shared";

export function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-muted-foreground">Unable to load dashboard stats.</p>;
  }

  const cards = [
    { label: "Earned today", value: formatMoney(stats.earned_today), icon: TrendingUp },
    { label: "This week", value: formatMoney(stats.earned_this_week), icon: TrendingUp },
    { label: "This month", value: formatMoney(stats.earned_this_month), icon: TrendingUp },
    { label: "Avg booking", value: formatMoneyDecimal(stats.average_booking_value), icon: TrendingUp },
    { label: "Completed", value: String(stats.completed_bookings), icon: CheckCircle },
    { label: "Upcoming", value: String(stats.upcoming_bookings), icon: Calendar },
    { label: "Cancellations", value: String(stats.cancellations), icon: XCircle },
    { label: "No-shows", value: String(stats.no_shows), icon: UserX },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold sm:text-2xl">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Revenue counts completed bookings only.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border border-border bg-card p-4 sm:p-5"
          >
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <card.icon size={16} className="shrink-0 text-primary" />
              <span className="text-xs sm:text-sm">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground sm:text-2xl">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
