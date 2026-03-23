"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { SearchIcon } from "lucide-react";
import DashboardHome from "@/components/dashboard-components/dashboardHome";
import DashboardLeads from "@/components/dashboard-components/dashboardLeads";
import DashboardApplications from "@/components/dashboard-components/dashboardApplications";
import DashboardPayments from "@/components/dashboard-components/dashboardPayments";
import SearchDrawer from "@/components/dashboard-components/SearchDrawer";
import ActivityLogsContent from "@/components/dashboard-components/ActivityLogsContent";
import ReportsLanding from "@/components/reports-components/ReportsLanding";
import { PermissionGuard } from "@/components/PermissionGuard";
import { AdministrativePermission } from "@/lib/utils";

import { useDashboardStore } from "@/stores/useDashboardStore";

export default function DashboardPage() {
    const topSelected = useDashboardStore((s) => s.topSelected);
    const [dashboardSubSelected, setDashboardSubSelected] = useState("leads");

    return (
        <div className="w-full flex flex-col px-6 py-4 gap-6">

            {topSelected === "dashboard" && (
                <div className="flex justify-center w-full">
                    <Tabs
                        aria-label="Dashboard Sub-sections"
                        selectedKey={dashboardSubSelected}
                        onSelectionChange={(key) => setDashboardSubSelected(key as string)}
                        variant="solid"
                        color="primary"
                        radius="full"
                        size="sm"
                        classNames={{
                            tabList: "bg-gray-100 p-1 rounded-full shadow-sm",
                            tab: "px-6 py-1 text-xs font-medium transition-all duration-200",
                            tabContent: "group-data-[selected=true]:text-white text-gray-600",
                            cursor: "bg-primary shadow-sm",
                        }}
                    >
                        <Tab key="leads" title="Leads" />
                        <Tab key="applications" title="Applications" />
                        <Tab key="payments" title="Payments" />
                    </Tabs>
                </div>
            )}

            <div className="min-h-[70vh]">
                {topSelected === "home" && <DashboardHome />}
                
                {topSelected === "dashboard" && (
                    <>
                        {dashboardSubSelected === "leads" && <DashboardLeads />}
                        {dashboardSubSelected === "applications" && <DashboardApplications />}
                        {dashboardSubSelected === "payments" && <DashboardPayments />}
                    </>
                )}

                {topSelected === "reports" && (
                    <PermissionGuard requiredPermissions={[AdministrativePermission.REPORTS_VIEW]}>
                        <ReportsLanding />
                    </PermissionGuard>
                )}

                {topSelected === "activity" && (
                    <PermissionGuard requiredPermissions={[AdministrativePermission.ACTIVITY_LOGS]}>
                        <ActivityLogsContent />
                    </PermissionGuard>
                )}
            </div>
        </div>
    );
}