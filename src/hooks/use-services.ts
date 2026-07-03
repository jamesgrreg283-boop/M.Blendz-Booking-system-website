"use client";

import { useEffect, useState, useCallback } from "react";
import type { ServiceRecord } from "@/types/booking";

export function useServices(admin = false) {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const url = admin ? "/api/admin/services" : "/api/services";
      const res = await fetch(url);
      if (res.ok) setServices(await res.json());
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { services, loading, refetch };
}
