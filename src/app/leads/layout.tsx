"use client"

import { AppSidebar } from "@/components/app-sidebar"
import LeadsHeader from "@/components/leads-components/leadsHeader"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar className="border-l-4 border-l-blue-500 min-w-13" />
            <SidebarInset className="rounded-t-xl border m-3 mb-0">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <div className="w-full py-3">
                    <LeadsHeader />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 m-3">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
