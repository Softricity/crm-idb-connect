"use client";
import TabsWrapper from "@/components/leads-components/tabsWrapper";
import { PermissionGuard } from "@/components/PermissionGuard";
import { LeadPermission } from "@/lib/utils";
import { useLeadStore } from "@/stores/useLeadStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { useBranchStore } from "@/stores/useBranchStore";

export default function Page() {
    const { leads, pagination, fetchLeadsBasedOnPermission } = useLeadStore();
    const { user } = useAuthStore();
    const { selectedBranch } = useBranchStore();
    const [page, setPage] = useState(1);
    
    useEffect(() => {
        if (user?.id && user?.permissions) {
            fetchLeadsBasedOnPermission(user.id, user.permissions, selectedBranch?.id, user?.role, page);
        }
    }, [fetchLeadsBasedOnPermission, user?.id, user?.permissions, user?.role, selectedBranch?.id, page]);
    
    return (
        <PermissionGuard requiredPermissions={[LeadPermission.LEAD_MANAGE, LeadPermission.LEAD_UPDATE]}>
            <TabsWrapper leads={leads} pagination={pagination} onPageChange={setPage} />
        </PermissionGuard>
    )
}