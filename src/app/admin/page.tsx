"use client";

import { Loader2 } from "lucide-react";
import { AdminLogin } from "@/components/admin/admin-login";
import {
  AdminDashboard,
  useAdminSession,
} from "@/components/admin/admin-dashboard";

export default function AdminPage() {
  const { authenticated, checkSession, setAuthenticated } = useAdminSession();

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <AdminLogin
        onSuccess={() => {
          setAuthenticated(true);
          checkSession();
        }}
      />
    );
  }

  return (
    <AdminDashboard
      onLogout={() => setAuthenticated(false)}
    />
  );
}
