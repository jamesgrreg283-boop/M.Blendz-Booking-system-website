"use client";

import { useState, useCallback } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BARBERS } from "@/lib/constants";
import { useServices } from "@/hooks/use-services";
import type { ServiceRecord } from "@/types/booking";
import { cn } from "@/lib/utils";

const emptyForm = {
  name: "",
  price: "",
  duration: "",
  description: "",
  category: "Services",
  barber_ids: [BARBERS[0]?.id ?? "m-blendz"],
};

export function AdminServices() {
  const { services, loading, refetch } = useServices(true);
  const [editing, setEditing] = useState<ServiceRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  };

  const openEdit = (s: ServiceRecord) => {
    setEditing(s);
    setForm({
      name: s.name,
      price: String(s.price),
      duration: String(s.duration),
      description: s.description ?? "",
      category: s.category ?? "Services",
      barber_ids: s.barber_ids.length ? s.barber_ids : [BARBERS[0].id],
    });
    setShowForm(true);
    setError("");
  };

  const toggleBarber = (id: string) => {
    setForm((f) => ({
      ...f,
      barber_ids: f.barber_ids.includes(id)
        ? f.barber_ids.filter((b) => b !== id)
        : [...f.barber_ids, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      name: form.name,
      price: Number(form.price),
      duration: Number(form.duration),
      description: form.description,
      category: form.category,
      barber_ids: form.barber_ids,
      active: true,
    };

    try {
      const url = editing
        ? `/api/admin/services/${editing.id}`
        : "/api/admin/services";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this service? It won't show on the booking page."))
      return;
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    refresh();
  };

  const reactivate = async (s: ServiceRecord) => {
    await fetch(`/api/admin/services/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: true }),
    });
    refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Services</h2>
          <p className="text-sm text-muted-foreground">
            Manage prices and durations shown on the booking page.
          </p>
        </div>
        <Button onClick={openNew} className="h-11 shrink-0">
          <Plus size={16} />
          <span className="hidden sm:inline">Add service</span>
        </Button>
      </div>

      <div className="space-y-3">
        {services.map((s) => (
          <div
            key={s.id}
            className={cn(
              "border border-border bg-card p-4 sm:p-5",
              !s.active && "opacity-50"
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground">
                  £{s.price} · {s.duration} min
                  {!s.active && " · Inactive"}
                </p>
                {s.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(s)}
                  className="h-10 flex-1 sm:flex-none"
                >
                  Edit
                </Button>
                {s.active ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deactivate(s.id)}
                    className="touch-target text-red-400"
                    aria-label="Deactivate"
                  >
                    <Trash2 size={16} />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reactivate(s)}
                    className="h-10"
                  >
                    Activate
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto border border-border bg-card p-5 pb-safe"
          >
            <h3 className="mb-4 text-lg font-semibold">
              {editing ? "Edit service" : "New service"}
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Price (£)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    min="5"
                    step="5"
                    value={form.duration}
                    onChange={(e) =>
                      setForm({ ...form, duration: e.target.value })
                    }
                    required
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm"
                />
              </div>
              {BARBERS.length > 1 && (
                <div className="space-y-2">
                  <Label>Barbers offering this service</Label>
                  <div className="flex flex-wrap gap-2">
                    {BARBERS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleBarber(b.id)}
                        className={cn(
                          "rounded-sm border px-3 py-2 text-sm",
                          form.barber_ids.includes(b.id)
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        )}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="h-11 flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="h-11 flex-1">
                {submitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
