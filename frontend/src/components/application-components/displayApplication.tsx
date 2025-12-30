"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { Download, Filter, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import LeadsTable from "@/components/leads-components/leadsTable";
import { Application, useApplicationStore } from "@/stores/useApplicationStore";
import ColumnVisibilitySelector, { ColumnConfig } from "../leads-components/columnVisibilitySelector";
import Link from "next/link";

// Default column configuration for applications
const DEFAULT_APPLICATION_COLUMNS: ColumnConfig[] = [
    { uid: "select", name: "", isVisible: true, isMandatory: true },
    { uid: "date", name: "Date", isVisible: true, isMandatory: true },
    { uid: "name", name: "Name", isVisible: true, isMandatory: true },
    { uid: "phone", name: "Phone", isVisible: true, isMandatory: false },
    { uid: "email", name: "Email", isVisible: true, isMandatory: false },
    { uid: "actions", name: "Action", isVisible: true, isMandatory: true },
];

interface ApplicationsDataTableProps {
    applications: Application[];
    selectedApplicationIds: string[];
    setSelectedApplicationIds: Dispatch<SetStateAction<string[]>>;
}

export default function ApplicationsDataTable({
    applications,
    selectedApplicationIds,
    setSelectedApplicationIds,
}: ApplicationsDataTableProps) {

    const { loading } = useApplicationStore();
    const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_APPLICATION_COLUMNS);

    const handleColumnsChange = (updatedColumns: ColumnConfig[]) => {
        setColumns(updatedColumns);
    };

    const handleDownloadCSV = () => {
        const applicationsToExport =
            selectedApplicationIds.length > 0
                ? applications.filter((app) => selectedApplicationIds.includes(app?.id ?? ""))
                : applications;

        if (applicationsToExport.length === 0) {
            alert("Please select at least one application to export.");
            return;
        }

        const headers = [
            "id", "student_id", "lead_id", "given_name", "surname", "email", "phone",
            "citizenship", "application_stage", "dob", "gender", "created_at"
        ];

        const csvContent = [
            headers.join(","),
            ...applicationsToExport.map(app =>
                headers.map(header => {
                    const value = (app as any)[header] ?? "";
                    const stringValue = String(value);
                    return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
                }).join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", `applications_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderContent = () => {
        if (loading) {
            return <ApplicationsTableSkeleton />;
        }

        if (!applications || applications.length === 0) {
            return (
                <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
                    <p>No applications found. Applications are created when leads are converted.</p>
                </div>
            );
        }

        // Map applications to leads shape for table reuse
        const leads = (applications as any[]).map(app => ({
            id: app.lead_id || app.id || '',
            name: [app.given_name, app.surname].filter(Boolean).join(' ') || '-',
            email: app.email || '-',
            mobile: app.phone || '-',
            type: 'application',
            preferred_country: app.country || '-',
            status: '-',
            created_at: app.created_at,
            utm_source: '',
            utm_medium: '',
            utm_campaign: '',
            assigned_to: '',
            created_by: '',
            reason: '',
            password: '',
            is_flagged: false,
            branch_id: app.branch_id || '',
            partners_leads_assigned_toTopartners: null,
        })) as import("@/stores/useLeadStore").Lead[];

        return (
            <div className="max-h-[67vh] overflow-y-auto">
                <LeadsTable
                    leads={leads}
                    selectedLeadIds={selectedApplicationIds}
                    setSelectedLeadIds={setSelectedApplicationIds}
                    columns={columns}
                />
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" disabled>
                        <Filter className="h-4 w-4 mr-2" /> Apply Filters
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <ColumnVisibilitySelector
                        columns={columns}
                        onColumnsChange={handleColumnsChange}
                        storageKey="applications_column_visibility"
                    />
                    <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        {selectedApplicationIds.length > 0
                            ? `Download (${selectedApplicationIds.length}) Selected`
                            : 'Download CSV'}
                    </Button>
                </div>
            </div>

            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
    );
}

function ApplicationsTableSkeleton() {
    return (
        <div className="w-full">
            <div className="max-h-[67vh] overflow-y-auto">
                <Table className="relative">
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="w-[50px]"><Skeleton className="h-4 w-4" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                            <TableHead className="text-center"><Skeleton className="h-4 w-16" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 8 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}