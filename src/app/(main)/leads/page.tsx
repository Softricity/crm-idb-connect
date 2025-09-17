"use client";
import TabsWrapper from "@/components/leads-components/tabsWrapper";
import { useLeadStore } from "@/stores/useLeadStore";
import { useEffect } from "react";

export default function Page() {
    const { leads, fetchLeads } = useLeadStore();
    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);
    return (
        <>
            <TabsWrapper leads={leads} />
        </>
    )
}