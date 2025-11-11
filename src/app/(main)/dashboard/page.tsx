"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { SearchIcon } from "lucide-react";
import DashboardHome from "@/components/dashboard-components/dashboardHome";
import DashboardLeads from "@/components/dashboard-components/dashboardLeads";
import DashboardApplications from "@/components/dashboard-components/dashboardApplications";
import DashboardPayments from "@/components/dashboard-components/dashboardPayments";
import SearchDrawer from "@/components/dashboard-components/SearchDrawer";

export default function Page() {
    const [selected, setSelected] = useState("home");
    const [openSearch, setOpenSearch] = useState(false);
    return (
        <div className="w-full flex flex-col px-6 py-4 gap-6">

            <div className="flex items-center justify-between w-full">

                <Tabs
                    aria-label="Dashboard Sections"
                    selectedKey={selected}
                    onSelectionChange={(key) => setSelected(key as string)}
                    variant="solid"
                    color="secondary"
                    radius="full"
                    classNames={{
                        tabList: "bg-gray-100 p-1 rounded-full shadow-sm",
                        tab: "px-6 py-2 text-sm font-medium",
                    }}
                >
                    <Tab key="home" title="Home" />
                    <Tab key="leads" title="Leads" />
                    <Tab key="applications" title="Applications" />
                    <Tab key="payments" title="Payments" />
                </Tabs>

                <div
                    onClick={() => setOpenSearch(true)}
                    className="cursor-pointer flex items-center gap-2 w-[260px] md:w-[320px] px-4 py-2 rounded-full border border-gray-300 text-gray-500 hover:border-blue-500 hover:bg-blue-50 transition"
                >
                    <SearchIcon className="h-4 w-4" />
                    <span className="text-sm">Search Anything...</span>
                </div>
            </div>

            <div className="min-h-[70vh]">
                {selected === "home" && <DashboardHome />}
                {selected === "leads" && <DashboardLeads />}
                {selected === "applications" && <DashboardApplications />}
                {selected === "payments" && <DashboardPayments />}
            </div>

            <SearchDrawer open={openSearch} onClose={() => setOpenSearch(false)} />

        </div>
    );
}