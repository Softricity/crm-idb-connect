"use client";

import React from "react";
import Sidebar from "@/components/sidebar"; // desktop sidebar
import Navbar from "@/components/navbar";   // mobile navbar
import { menus } from "@/config/menus";    // unified menus
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const initAuth = useAuthStore((state) => state.initAuth);

    useEffect(() => {
      initAuth();
    }, [initAuth]);
  return (
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
      <Toaster richColors position="top-right" />
    </div>
  );
}
