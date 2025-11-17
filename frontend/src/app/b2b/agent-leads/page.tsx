"use client";
import TabsWrapper from "@/components/leads-components/tabsWrapper";
import { useLeadStore } from "@/stores/useLeadStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";

export default function Page() {
    const { user } = useAuthStore();
    
    const leads = useLeadStore((state) => state.leads);

    useEffect(() => {
        if (user?.id) {
            const leadStore = useLeadStore.getState() as any;
            if (leadStore.getAgentLeads) {
                leadStore.getAgentLeads(user.id);
            }
        }
    }, [user]);

    return (
        <>
            <TabsWrapper leads={leads} />
        </>
    )
}