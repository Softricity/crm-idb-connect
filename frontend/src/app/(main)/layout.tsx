"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar"; // desktop sidebar
import Navbar from "@/components/navbar";   // mobile navbar
import BranchSelector from "@/components/BranchSelector";
import { menus } from "@/config/menus";    // unified menus
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePartnerStore } from "@/stores/usePartnerStore";
import { useBranchStore } from "@/stores/useBranchStore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const initAuth = useAuthStore((state) => state.initAuth);
    const loading = useAuthStore((s) => s.loading);
    const user = useAuthStore((s) => s.user);
    const loadCurrentPartner = usePartnerStore((s) => s.loadCurrentPartner);
    const { selectedBranch, setSelectedBranch, fetchBranches } = useBranchStore();
    const router = useRouter();
    const [selectedBranchId, setSelectedBranchId] = useState("");

    useEffect(() => {
      initAuth();
      fetchBranches();
    }, [initAuth, fetchBranches]);

    // enforce permission-based access for main/admin layout
    useEffect(() => {
      if (loading) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (user && user.id) {
        loadCurrentPartner(user.id).catch(() => {});
      }

      // Check if user has restricted access (external agent)
      const permissions = user.permissions || [];
      const isRestricted = permissions.includes("Lead Create") && !permissions.includes("Lead Manage");
      
      if (isRestricted) {
        router.replace("/b2b");
        return;
      }
      // All other users (internal team) can access main panel
    }, [loading, user, router, loadCurrentPartner]);
  return (
    <div className="min-h-screen">
      <Toaster richColors position="top-right" />
      {loading || !user || ((user.permissions || []).includes("Lead Create") && !(user.permissions || []).includes("Lead Manage")) ? (
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

            {/* Desktop Header with Branch Selector */}
            <div className="hidden lg:flex items-center justify-end px-6 py-3 border-b border-gray-200 bg-white">
              <div className="w-80">
                <BranchSelector
                  value={selectedBranchId}
                  onChange={(branchId) => {
                    setSelectedBranchId(branchId);
                    const branch = useBranchStore.getState().getBranchById(branchId);
                    setSelectedBranch(branch);
                  }}
                  label=""
                  placeholder="Select branch"
                />
              </div>
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
