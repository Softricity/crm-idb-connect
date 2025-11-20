"use client"

import { Tabs, Tab } from "@heroui/react"
import DashboardLeads from "./dashboardLeads"
import DashboardApplications from "./dashboardApplications"
import DashboardPayments from "./dashboardPayments"
import { useAuthStore } from "@/stores/useAuthStore"
import { hasAnyPermission } from "@/lib/utils"
import { LeadPermission, ApplicationPermission, OfflinePaymentPermission } from "@/lib/utils"

export default function HeaderTabs() {
    const { user } = useAuthStore();
    const userPermissions = user?.permissions || [];
    
    const canViewLeads = hasAnyPermission(userPermissions, [LeadPermission.LEAD_MANAGE, LeadPermission.LEAD_UPDATE]);
    const canViewApplications = hasAnyPermission(userPermissions, [ApplicationPermission.APPLICATION_MANAGE]);
    const canViewPayments = hasAnyPermission(userPermissions, [OfflinePaymentPermission.OFFLINE_PAYMENT_APPROVAL, OfflinePaymentPermission.OFFLINE_PAYMENT_RECEIVE]);

    return (
        <div className="flex w-full flex-col">
            <Tabs aria-label="Dashboard Sections" variant="bordered" color="secondary" className="w-full" >
                <Tab key="home" title="Home">
                    <DashboardLeads />
                </Tab>
                {canViewLeads && (
                    <Tab key="leads" title="Leads">
                        <DashboardLeads />
                    </Tab>
                )}
                {canViewApplications && (
                    <Tab key="admissions" title="Applications">
                        <DashboardApplications />
                    </Tab>
                )}
                {canViewPayments && (
                    <Tab key="payments" title="Payments">
                        <DashboardPayments />
                    </Tab>
                )}
            </Tabs>
        </div>
    )
}
