"use client";
import TabsWrapper from "@/components/leads-components/tabsWrapper";
import { PermissionGuard } from "@/components/PermissionGuard";
import { LeadPermission } from "@/lib/utils";
import { useLeadStore } from "@/stores/useLeadStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";
import { useBranchStore } from "@/stores/useBranchStore";

export default function Page() {
    const { leads, fetchLeadsBasedOnPermission } = useLeadStore();
    const { user } = useAuthStore();
    const { selectedBranch } = useBranchStore();
    
    useEffect(() => {
        if (user?.id && user?.permissions) {
            fetchLeadsBasedOnPermission(user.id, user.permissions, selectedBranch?.id);
        }
    }, [fetchLeadsBasedOnPermission, user?.id, user?.permissions, selectedBranch?.id]);
    
    return (
        <PermissionGuard requiredPermissions={[LeadPermission.LEAD_MANAGE, LeadPermission.LEAD_UPDATE]}>
            <TabsWrapper leads={leads} />
        </PermissionGuard>
    )
}