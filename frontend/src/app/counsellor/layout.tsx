"use client";

import { CounsellorSidebar } from '@/components/counsellor-sidebar'
import React, { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePartnerStore } from '@/stores/usePartnerStore'
import { useRouter } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { Loader2 } from 'lucide-react'

export default function CounsellorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const initAuth = useAuthStore((state) => state.initAuth);
    const loading = useAuthStore((s) => s.loading)
    const user = useAuthStore((s) => s.user)
    const loadCurrentPartner = usePartnerStore((s) => s.loadCurrentPartner)
    const router = useRouter()

    // initialize client auth on mount
    useEffect(() => {
        initAuth()
    }, [initAuth])

    // when auth finishes loading, enforce role-based access
    useEffect(() => {
        if (loading) return

        // if not authenticated, send to login
        if (!user) {
            router.replace('/login')
            return
        }

        // load partner details if needed
        if (user && user.id) {
            loadCurrentPartner(user.id).catch(() => {})
        }

        // enforce role: only counsellor should access this layout
        if (user.role !== 'counsellor') {
            if (user.role === 'agent') {
                router.replace('/b2b')
            } else {
                router.replace('/dashboard')
            }
        }
    }, [loading, user, router, loadCurrentPartner])

    return (
        <div className="min-h-screen">
            <Toaster />
            {loading || !user || user.role !== 'counsellor' ? (
                <div className="flex h-screen w-screen items-center justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
                </div>
            ) : (
                <div className="flex h-screen w-full">
                    <CounsellorSidebar />
                    <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                        {children}
                    </main>
                </div>
            )}
        </div>
    )
}
