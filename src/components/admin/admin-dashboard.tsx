"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  Calendar,
  CalendarPlus,
  LayoutDashboard,
  List,
  LogOut,
  RefreshCw,
  Scissors,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_NAME } from "@/lib/constants";
import { AdminBookings } from "./admin-bookings";
import { AdminManualBooking } from "./admin-manual-booking";
import { AdminBlockSlots } from "./admin-block-slots";
import { AdminOverview } from "./admin-overview";
import { AdminCalendar } from "./admin-calendar";
import { AdminCustomers } from "./admin-customers";
import { AdminServices } from "./admin-services";
import { cn } from "@/lib/utils";

type Tab =
  | "overview"
  | "calendar"
  | "bookings"
  | "customers"
  | "manual"
  | "blocks"
  | "services";

const TABS: {
  id: Tab;
  label: string;
  shortLabel: string;
  icon: typeof List;
}[] = [
  { id: "overview", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", shortLabel: "Cal", icon: Calendar },
  { id: "bookings", label: "Bookings", shortLabel: "Book", icon: List },
  { id: "customers", label: "Customers", shortLabel: "Clients", icon: Users },
  {
    id: "manual",
    label: "Add Booking",
    shortLabel: "Add",
    icon: CalendarPlus,
  },
  { id: "blocks", label: "Block Time", shortLabel: "Block", icon: Ban },
  { id: "services", label: "Services", shortLabel: "Svc", icon: Scissors },
];

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    onLogout();
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-safe">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="shrink-0 touch-target"
            >
              <Link href="/" aria-label="Back to site">
                <ArrowLeft size={20} />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold sm:text-lg">
                Admin
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                {BUSINESS_NAME}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="touch-target sm:h-9 sm:w-auto sm:px-4"
              aria-label="Refresh"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="touch-target sm:h-9 sm:w-auto sm:px-4"
              aria-label="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-5 md:px-8 [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex min-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-2.5 text-sm transition-colors sm:px-4",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground active:bg-muted"
              )}
            >
              <t.icon size={15} className="shrink-0" />
              <span className="sm:hidden">{t.shortLabel}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-5 sm:py-8 md:px-8">
        {tab === "overview" && <AdminOverview key={refreshKey} />}
        {tab === "calendar" && (
          <AdminCalendar key={refreshKey} onChanged={handleRefresh} />
        )}
        {tab === "bookings" && <AdminBookings key={refreshKey} />}
        {tab === "customers" && <AdminCustomers key={refreshKey} />}
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
        {tab === "services" && <AdminServices key={refreshKey} />}
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
