// app/(dashboard)/layout.tsx
"use client";

import React, { useEffect } from "react";
import Sidebar from "@/components/b2b-sidebar"; // desktop sidebar
import Navbar from "@/components/navbar";   // mobile navbar
import { b2bMenus } from "@/config/menus";    // unified menus
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePartnerStore } from "@/stores/usePartnerStore";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const FullPageLoader = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-background">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);
  const loading = useAuthStore((state) => state.loading);
  const { user } = useAuthStore();
  const { loadCurrentPartner } = usePartnerStore();
  const router = useRouter();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // enforce role-based access for B2B (agents)
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user && user.id) {
      loadCurrentPartner(user.id).catch(() => {});
    }

    if (user.role !== "agent") {
      if (user.role === "counsellor") {
        router.replace("/counsellor");
      } else if (user.role === "admin") {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [loading, user, router, loadCurrentPartner]);

  if (loading || !user || user.role !== "agent") {
    return <FullPageLoader />;
  }

  return (
    <div className="flex h-screen w-full">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Mobile Navbar */}
        <div className="lg:hidden">
          <Navbar menus={b2bMenus} />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Global Toaster */}
      <Toaster richColors position="top-right" />
    </div>
  );
}
