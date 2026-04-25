"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar"; // desktop sidebar
import Navbar from "@/components/navbar";   // mobile navbar
import BranchSelector from "@/components/BranchSelector";
import { menus, b2bMenus, counsellorMenus } from "@/config/menus";    // unified menus
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePartnerStore } from "@/stores/usePartnerStore";
import { useBranchStore } from "@/stores/useBranchStore";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, SearchIcon } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { Tabs, Tab } from "@heroui/react";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { AdministrativePermission } from "@/lib/utils";
import SearchDrawer from "@/components/dashboard-components/SearchDrawer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const initAuth = useAuthStore((state) => state.initAuth);
    const refreshSession = useAuthStore((state) => state.refreshSession);
    const loading = useAuthStore((s) => s.loading);
    const user = useAuthStore((s) => s.user);
    const loadCurrentPartner = usePartnerStore((s) => s.loadCurrentPartner);
    const { selectedBranch, setSelectedBranch, fetchBranches } = useBranchStore();
    const router = useRouter();
    const pathname = usePathname();
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [openSearch, setOpenSearch] = useState(false);
    
    // Dashboard navigation state
    const topSelected = useDashboardStore((s) => s.topSelected);
    const setTopSelected = useDashboardStore((s) => s.setTopSelected);

    // Current page title mapping
    const getPageTitle = () => {
      if (pathname === "/dashboard") return "";
      const allMenus = [...menus, ...b2bMenus, ...counsellorMenus];
      const menuItem = allMenus.find(m => m.link === pathname);
      return menuItem?.title || "";
    };
    const pageTitle = getPageTitle();

    useEffect(() => {
      initAuth().then(() => {
        setHasCheckedAuth(true);
      });
      fetchBranches();
    }, [initAuth, fetchBranches]);

    useEffect(() => {
      if (!user) return;

      const refresh = () => {
        refreshSession().catch(() => {});
      };

      const interval = setInterval(refresh, 60_000);
      const onFocus = () => refresh();
      const onVisibility = () => {
        if (document.visibilityState === "visible") {
          refresh();
        }
      };

      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onVisibility);

      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }, [user?.id, refreshSession]);

    // enforce permission-based access for main/admin layout - only check once after initAuth completes
    useEffect(() => {
      // Wait for initAuth to complete first
      if (!hasCheckedAuth) {
        return;
      }

      // If no user after initAuth completes, redirect to login
      if (!user) {
        router.replace("/login");
        return;
      }

      // Load partner data
      if (user.id) {
        loadCurrentPartner(user.id).catch(() => {});
      }
    }, [user, router, loadCurrentPartner, hasCheckedAuth]);

  return (
    <div className="min-h-screen">
      <Toaster richColors position="top-right" />
      {loading || !user ? (
        <div className="flex h-screen w-screen items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
        </div>
      ) : (
        <div className="flex h-screen w-full overflow-x-hidden">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 min-w-0 overflow-x-hidden">
            {/* Mobile Navbar */}
            <div className="lg:hidden">
              <Navbar menus={menus} />
            </div>

            {/* Desktop Header with Branch Selector & Notifications */}
            <div className="hidden lg:flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-white gap-6 min-h-[64px]">
              <div className="flex items-center gap-6 flex-1">
                {pathname === "/dashboard" ? (
                  <Tabs
                    aria-label="Dashboard Navigation"
                    selectedKey={topSelected}
                    onSelectionChange={(key) => setTopSelected(key as string)}
                    variant="solid"
                    radius="full"
                    classNames={{
                      tabList: "bg-gray-100/80 p-0.5 gap-1",
                      tab: "px-6 h-8 text-sm font-medium transition-all duration-200",
                      tabContent: "group-data-[selected=true]:text-white text-gray-600",
                      cursor: "bg-primary shadow-sm",
                    }}
                  >
                    <Tab key="home" title="Home" />
                    <Tab key="dashboard" title="Dashboard" />
                    {(user?.role === "superadmin" || user?.permissions?.includes(AdministrativePermission.REPORTS_VIEW)) && (
                      <Tab key="reports" title="Reports" />
                    )}
                    {(user?.role === "superadmin" || user?.permissions?.includes(AdministrativePermission.ACTIVITY_LOGS)) && (
                      <Tab key="activity" title="Activity Logs" />
                    )}
                  </Tabs>
                ) : (
                  <h1 className="text-xl font-bold text-gray-800">{pageTitle}</h1>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div
                  onClick={() => setOpenSearch(true)}
                  className="flex items-center gap-2 w-64 px-4 py-1.5 rounded-full border border-gray-200 text-gray-400 hover:border-primary/50 hover:bg-gray-50 transition cursor-pointer group"
                >
                  <SearchIcon className="h-4 w-4 group-hover:text-primary transition-colors" />
                  <span className="text-sm">Search Anything...</span>
                </div>
                <NotificationBell />
                <div className="w-64">
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
            </div>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
              {children}
            </main>
          </div>
        </div>
      )}
      <SearchDrawer open={openSearch} onClose={() => setOpenSearch(false)} />
    </div>
  );
}
