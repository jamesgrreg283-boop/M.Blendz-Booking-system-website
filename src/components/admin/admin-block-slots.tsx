"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Trash2, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BARBERS } from "@/lib/constants";
import { formatDisplayDate, formatDisplayTime } from "@/lib/booking-utils";
import type { BlockedSlot } from "@/types/booking";
import { cn } from "@/lib/utils";

type BlockType = "slot" | "day" | "range";

interface AdminBlockSlotsProps {
  onChanged: () => void;
}

export function AdminBlockSlots({ onChanged }: AdminBlockSlotsProps) {
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockType, setBlockType] = useState<BlockType>("day");
  const [form, setForm] = useState({
    barber: "*",
    date: "",
    end_date: "",
    time: "",
    end_time: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchBlocked = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blocked-slots");
      if (res.ok) setBlocked(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload: Record<string, string | undefined> = {
      barber: form.barber,
      date: form.date,
      reason: form.reason || undefined,
    };

    if (blockType === "range") {
      payload.end_date = form.end_date;
    } else if (blockType === "slot") {
      payload.time = form.time;
      if (form.end_time) payload.end_time = form.end_time;
    }

    try {
      const res = await fetch("/api/admin/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to block time");

      setForm({
        barber: "*",
        date: "",
        end_date: "",
        time: "",
        end_time: "",
        reason: "",
      });
      fetchBlocked();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/blocked-slots/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchBlocked();
      onChanged();
    }
  };

  const blockTypes: { id: BlockType; label: string; desc: string }[] = [
    { id: "day", label: "Full Day", desc: "Block an entire day off" },
    { id: "range", label: "Date Range", desc: "Holiday or multi-day break" },
    { id: "slot", label: "Time Slot", desc: "Block specific hours" },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <h2 className="mb-2 text-xl font-semibold">Block Time Off</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Prevent customers from booking during breaks, holidays, or personal
          time.
        </p>

        <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {blockTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setBlockType(t.id)}
              className={cn(
                "min-h-14 border p-3 text-left text-sm transition-colors active:scale-[0.99] sm:min-h-0",
                blockType === t.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <p className="font-medium">{t.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Barber</Label>
            <select
              value={form.barber}
              onChange={(e) => setForm({ ...form, barber: e.target.value })}
              className="flex h-12 w-full rounded-sm border border-input bg-card px-4 text-base sm:text-sm"
            >
              <option value="*">All barbers</option>
              {BARBERS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="b-date">
              {blockType === "range" ? "Start date" : "Date"}
            </Label>
            <Input
              id="b-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          {blockType === "range" && (
            <div className="space-y-2">
              <Label htmlFor="b-end">End date</Label>
              <Input
                id="b-end"
                type="date"
                value={form.end_date}
                onChange={(e) =>
                  setForm({ ...form, end_date: e.target.value })
                }
                required
              />
            </div>
          )}

          {blockType === "slot" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="b-time">Start time</Label>
                <Input
                  id="b-time"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-end-time">End time (optional)</Label>
                <Input
                  id="b-end-time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="b-reason">Reason (optional)</Label>
            <Input
              id="b-reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Holiday, lunch break, etc."
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" disabled={submitting} className="h-12 w-full sm:w-auto">
            {submitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Block Time"
            )}
          </Button>
        </form>
      </div>

      <div>
        <h3 className="mb-4 font-semibold">Currently Blocked</h3>
        {loading ? (
          <Loader2 className="animate-spin text-primary" size={24} />
        ) : blocked.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blocked time slots.</p>
        ) : (
          <div className="space-y-3">
            {blocked.map((b) => (
              <div
                key={b.id}
                className="flex items-start justify-between gap-4 border border-border bg-card p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CalendarOff size={14} className="text-primary" />
                    <p className="text-sm font-medium">
                      {b.end_date
                        ? `${formatDisplayDate(b.date)} – ${formatDisplayDate(b.end_date)}`
                        : formatDisplayDate(b.date)}
                    </p>
                  </div>
                  {b.time && (
                    <p className="text-sm text-muted-foreground">
                      {formatDisplayTime(b.time)}
                      {b.end_time && ` – ${formatDisplayTime(b.end_time)}`}
                    </p>
                  )}
                  {!b.time && !b.end_date && (
                    <p className="text-sm text-muted-foreground">Full day</p>
                  )}
                  {b.reason && (
                    <p className="text-xs text-muted-foreground">{b.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Barber:{" "}
                    {b.barber === "*"
                      ? "All"
                      : BARBERS.find((br) => br.id === b.barber)?.name ??
                        b.barber}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(b.id)}
                  className="touch-target shrink-0 text-red-400 hover:text-red-300"
                  aria-label="Remove block"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
