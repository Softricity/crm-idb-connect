"use client";

import React, { useEffect } from "react";
import Sidebar from "@/components/sidebar"; // desktop sidebar
import Navbar from "@/components/navbar";   // mobile navbar
import { menus } from "@/config/menus";    // unified menus
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePartnerStore } from "@/stores/usePartnerStore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const initAuth = useAuthStore((state) => state.initAuth);
    const loading = useAuthStore((s) => s.loading);
    const user = useAuthStore((s) => s.user);
    const loadCurrentPartner = usePartnerStore((s) => s.loadCurrentPartner);
    const router = useRouter();

    useEffect(() => {
      initAuth();
    }, [initAuth]);

    // enforce role-based access for main/admin layout
    useEffect(() => {
      if (loading) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (user && user.id) {
        loadCurrentPartner(user.id).catch(() => {});
      }

      // only admin should access main layout
      if (user.role !== "admin") {
        if (user.role === "agent") {
          router.replace("/b2b");
        } else if (user.role === "counsellor") {
          router.replace("/counsellor");
        } else {
          router.replace("/login");
        }
      }
    }, [loading, user, router, loadCurrentPartner]);
  return (
    <div className="min-h-screen">
      <Toaster richColors position="top-right" />
      {loading || !user || user.role !== "admin" ? (
        <div className="flex h-screen w-screen items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
        </div>
      ) : (
        <div className="flex h-screen w-full">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex flex-col flex-1">
            {/* Mobile Navbar */}
            <div className="lg:hidden">
              <Navbar menus={menus} />
            </div>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
            </main>
          </div>

          {/* Global Toaster */}
        </div>
      )}
    </div>
  );
}
