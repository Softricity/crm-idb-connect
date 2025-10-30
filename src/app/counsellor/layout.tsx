"use client";

import { CounsellorSidebar } from '@/components/counsellor-sidebar'
import React from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

export default function CounsellorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const initAuth = useAuthStore((state) => state.initAuth);

    React.useEffect(() => {
        initAuth();
    }, [initAuth]);

    return (
        <div className="flex h-screen w-full">
            <CounsellorSidebar />
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                {children}
            </main>
        </div>
    )
}
