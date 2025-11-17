"use client"

import { Tabs, Tab } from "@heroui/react"
import DashboardLeads from "./dashboardLeads"
import DashboardApplications from "./dashboardApplications"
import DashboardPayments from "./dashboardPayments"

export default function HeaderTabs() {
    return (
        <div className="flex w-full flex-col">
            <Tabs aria-label="Dashboard Sections" variant="bordered" color="secondary" className="w-full" >
                <Tab key="home" title="Home">
                    <DashboardLeads />
                </Tab>
                <Tab key="leads" title="Leads">
                    <DashboardLeads />
                </Tab>
                <Tab key="admissions" title="Applications">
                    <DashboardApplications />
                </Tab>
                <Tab key="payments" title="Payments">
                    <DashboardPayments />
                </Tab>
            </Tabs>
        </div>
    )
}
