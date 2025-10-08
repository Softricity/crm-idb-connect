"use client";
import ApplicationsDataTable from "@/components/application-components/displayApplication";
import { useLeadStore } from "@/stores/useLeadStore";
import React, { useEffect, useState } from "react";

export default function Page() {
    const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
    const { applications, fetchApplications } = useLeadStore();
    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    return (
        <>
            <ApplicationsDataTable
                applications={applications}
                selectedApplicationIds={selectedApplicationIds}
                setSelectedApplicationIds={setSelectedApplicationIds}
            />
        </>
    );
}
