"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarPlus,
  LogOut,
  RefreshCw,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_NAME } from "@/lib/constants";
import { AdminBookings } from "./admin-bookings";
import { AdminManualBooking } from "./admin-manual-booking";
import { AdminBlockSlots } from "./admin-block-slots";
import { cn } from "@/lib/utils";

type Tab = "bookings" | "manual" | "blocks";

const TABS: { id: Tab; label: string; icon: typeof CalendarPlus }[] = [
  { id: "bookings", label: "Bookings", icon: CalendarPlus },
  { id: "manual", label: "Add Booking", icon: CalendarPlus },
  { id: "blocks", label: "Block Time", icon: Ban },
];

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>("bookings");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container-narrow mx-auto flex h-16 items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/">
                <ArrowLeft size={20} />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Admin</h1>
              <p className="text-xs text-muted-foreground">{BUSINESS_NAME}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        <nav className="container-narrow mx-auto flex gap-1 overflow-x-auto px-5 pb-3 md:px-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-sm px-4 py-2 text-sm transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="container-narrow mx-auto px-5 py-8 md:px-8">
        {tab === "bookings" && <AdminBookings key={refreshKey} />}
        {tab === "manual" && (
          <AdminManualBooking
            key={refreshKey}
            onCreated={() => {
              handleRefresh();
              setTab("bookings");
            }}
          />
        )}
        {tab === "blocks" && (
          <AdminBlockSlots key={refreshKey} onChanged={handleRefresh} />
        )}
      </main>
    </div>
  );
}

export function useAdminSession() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session");
      const data = await res.json();
      setAuthenticated(data.authenticated);
    } catch {
      setAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return { authenticated, checkSession, setAuthenticated };
}
