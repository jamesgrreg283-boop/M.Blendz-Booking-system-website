"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BARBERS } from "@/lib/constants";
import type { CustomerWithStats } from "@/lib/customer-utils";
import { formatMoney } from "./admin-shared";
import { cn } from "@/lib/utils";

type Filter = "all" | "no_shows";

export function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<CustomerWithStats | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      if (res.ok) setCustomers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false);
    const matchesFilter =
      filter === "all" || (filter === "no_shows" && c.no_show_count > 0);
    return matchesSearch && matchesFilter;
  });

  const openCustomer = (c: CustomerWithStats) => {
    setSelected(c);
    setNotes(c.notes ?? "");
  };

  const saveNotes = async () => {
    if (!selected || selected.id.startsWith("derived-")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        await fetchCustomers();
        setSelected(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const barberName = (id?: string) =>
    BARBERS.find((b) => b.id === id)?.name ?? id ?? "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Customers</h2>
        <p className="text-sm text-muted-foreground">
          Profiles update automatically when bookings are completed.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email..."
            className="h-11 pl-9"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "min-h-11 flex-1 rounded-sm px-4 text-sm sm:flex-none",
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground"
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("no_shows")}
            className={cn(
              "min-h-11 flex-1 rounded-sm px-4 text-sm sm:flex-none",
              filter === "no_shows"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground"
            )}
          >
            No-shows
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No customers found.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <button
              key={c.id + c.phone}
              type="button"
              onClick={() => openCustomer(c)}
              className="w-full border border-border bg-card p-4 text-left active:scale-[0.99] sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{c.name}</p>
                    {c.is_repeat_offender && (
                      <span className="flex items-center gap-1 rounded-sm bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">
                        <AlertTriangle size={12} />
                        Repeat no-show
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.phone}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium text-primary">
                    {formatMoney(c.total_spent)}
                  </p>
                  <p className="text-muted-foreground">
                    {c.visit_count} visits
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto border border-border bg-card p-5 pb-safe">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selected.name}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelected(null)}
                className="touch-target"
              >
                <X size={20} />
              </Button>
            </div>

            {selected.is_repeat_offender && (
              <div className="mb-4 flex items-start gap-2 border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-300">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>
                  Warning: this customer has {selected.no_show_count} previous
                  no-shows.
                </span>
              </div>
            )}

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>
                  <a href={`tel:${selected.phone}`} className="text-primary">
                    {selected.phone}
                  </a>
                </dd>
              </div>
              {selected.email && (
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{selected.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Visited</dt>
                <dd>{selected.visit_count} times</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last cut</dt>
                <dd>{selected.last_service ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total spent</dt>
                <dd className="font-medium text-primary">
                  {formatMoney(selected.total_spent)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Favourite barber</dt>
                <dd>{barberName(selected.favourite_barber)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">No-shows</dt>
                <dd>
                  {selected.no_show_count}
                  {selected.last_no_show_date &&
                    ` (last: ${new Date(selected.last_no_show_date + "T12:00:00").toLocaleDateString("en-GB")})`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cancelled</dt>
                <dd>{selected.cancelled_count}</dd>
              </div>
            </dl>

            {!selected.id.startsWith("derived-") && (
              <div className="mt-5 space-y-2">
                <Label htmlFor="cust-notes">Notes</Label>
                <textarea
                  id="cust-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm"
                  placeholder="Likes #2 on top. Prefers Friday evenings."
                />
                <Button
                  onClick={saveNotes}
                  disabled={saving}
                  className="h-11 w-full"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "Save notes"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
