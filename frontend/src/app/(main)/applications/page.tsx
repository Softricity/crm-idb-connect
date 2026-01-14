"use client";
import ApplicationsDataTable from "@/components/application-components/displayApplication";
import { PermissionGuard } from "@/components/PermissionGuard";
import { ApplicationPermission } from "@/lib/utils";
import { useApplicationStore } from "@/stores/useApplicationStore";
import { useBranchStore } from "@/stores/useBranchStore";
import React, { useEffect, useState } from "react";

export default function Page() {
    const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
    const { applications, fetchApplications } = useApplicationStore();
    const { selectedBranch } = useBranchStore();
    useEffect(() => {
        // Fetch applications filtered by selected branch
        fetchApplications(undefined, selectedBranch?.id);
    }, [fetchApplications, selectedBranch?.id]);

    return (
        <PermissionGuard requiredPermissions={[ApplicationPermission.APPLICATION_MANAGE]}>
            <ApplicationsDataTable
                applications={applications}
                selectedApplicationIds={selectedApplicationIds}
                setSelectedApplicationIds={setSelectedApplicationIds}
            />
        </PermissionGuard>
    );
}
