// app/(dashboard)/layout.tsx
"use client"

import { AppSidebar } from "@/components/b2b-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { useAuthStore } from "@/stores/useAuthStore"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { usePartnerStore } from "@/stores/usePartnerStore"

const FullPageLoader = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-background">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);
  const loading = useAuthStore((state) => state.loading);

  const { user } = useAuthStore()
  const { loadCurrentPartner } = usePartnerStore()

  useEffect(() => {
    initAuth().then(() => {
      if (user?.type === "partner") {
        loadCurrentPartner(user.id)
      }
    })
  }, [user?.id])
  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="sm:rounded-t-[40px] sm:px-4 sm:border sm:m-3 sm:mb-0 bg-muted/30">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background sm:rounded-t-[32px] px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-lg font-black sm:hidden">IDB Connect</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </main>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  )
}