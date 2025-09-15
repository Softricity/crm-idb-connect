"use client"

import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from "@/components/ui/tabs"
import DashboardLeads from "./dashboardLeads"
import DashboardCounsellings from "./dashboardCounsellings"
import DashboardApplications from "./dashboardApplications"
import DashboardVisas from "./dashboardVisas"
import DashboardTasks from "./dashboardTasks"
import DashboardFollowUps from "./dashboardFollowUps"
import DashboardPayments from "./dashboardPayments"
import DashboardTeamPerformance from "./dashboardTeamPerf"

export default function HeaderTabs() {
    return (
        <div className="w-full">
            <Tabs defaultValue="leads" className="w-full">
                <div className="w-full overflow-x-auto overflow-y-hidden">
                <TabsList className="rounded-md w-100% md:w-[97%] py-5 px-0 mx-auto flex gap-2 bg-muted/40 shadow">
                    <TabsTrigger
                        value="leads"
                        className="data-[state=active]:bg-teal-600 text-md data-[state=active]:text-white rounded-md px-4 py-5 transition-colors"
                    >
                        Leads
                    </TabsTrigger>
                    <TabsTrigger
                        value="counsellings"
                        className="data-[state=active]:bg-teal-600 text-md data-[state=active]:text-white rounded-md px-4 py-5 transition-colors"
                    >
                        Counsellings
                    </TabsTrigger>
                    <TabsTrigger
                        value="admissions"
                        className="data-[state=active]:bg-teal-600 text-md data-[state=active]:text-white rounded-md px-4 py-5 transition-colors"
                    >
                        Admission Applications
                    </TabsTrigger>
                    <TabsTrigger
                        value="visas"
                        className="data-[state=active]:bg-teal-600 text-md data-[state=active]:text-white rounded-md px-4 py-5 transition-colors"
                    >
                        Visas
                    </TabsTrigger>
                    <TabsTrigger
                        value="tasks"
                        className="data-[state=active]:bg-teal-600 text-md data-[state=active]:text-white rounded-md px-4 py-5 transition-colors"
                    >
                        Tasks
                    </TabsTrigger>
                    <TabsTrigger
                        value="followups"
                        className="data-[state=active]:bg-teal-600 text-md data-[state=active]:text-white rounded-md px-4 py-5 transition-colors"
                    >
                        Follow Ups
                    </TabsTrigger>
                    <TabsTrigger
                        value="payments"
                        className="data-[state=active]:bg-teal-600 text-md data-[state=active]:text-white rounded-md px-4 py-5 transition-colors"
                    >
                        Payments
                    </TabsTrigger>
                    <TabsTrigger
                        value="team"
                        className="data-[state=active]:bg-teal-600 text-md data-[state=active]:text-white rounded-md px-4 py-5 transition-colors"
                    >
                        Team Performance
                    </TabsTrigger>
                </TabsList>
                </div>
                <TabsContent value="leads">
                    <div className="p-4 text-center text-muted-foreground">
                        <DashboardLeads />
                    </div>
                </TabsContent>
                <TabsContent value="counsellings">
                    <div className="p-4 text-center text-muted-foreground">
                        <DashboardCounsellings />
                    </div>
                </TabsContent>
                <TabsContent value="admissions">
                    <div className="p-4 text-center text-muted-foreground">
                        <DashboardApplications />
                    </div>
                </TabsContent>
                <TabsContent value="visas">
                    <div className="p-4 text-center text-muted-foreground">
                        <DashboardVisas />
                    </div>
                </TabsContent>
                <TabsContent value="tasks">
                    <div className="p-4 text-center text-muted-foreground">
                        <DashboardTasks />
                    </div>
                </TabsContent>
                <TabsContent value="followups">
                    <div className="p-4 text-center text-muted-foreground">
                        <DashboardFollowUps />
                    </div>
                </TabsContent>
                <TabsContent value="payments">
                    <div className="p-4 text-center text-muted-foreground">
                        <DashboardPayments />
                    </div>
                </TabsContent>
                <TabsContent value="team">
                    <div className="p-4 text-center text-muted-foreground">
                        <DashboardTeamPerformance />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
