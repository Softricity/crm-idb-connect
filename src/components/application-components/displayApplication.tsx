"use client";

import { Dispatch, SetStateAction } from "react";
import { Download, Filter, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Lead, useLeadStore } from "@/stores/useLeadStore";
import LeadsTable from "../leads-components/leadsTable";

interface ApplicationsDataTableProps {
    applications: Lead[];
    selectedApplicationIds: string[];
    setSelectedApplicationIds: Dispatch<SetStateAction<string[]>>;
}

export default function ApplicationsDataTable({
    applications,
    selectedApplicationIds,
    setSelectedApplicationIds,
}: ApplicationsDataTableProps) {

    const { loading } = useLeadStore();

    const handleDownloadCSV = () => {
        const applicationsToExport =
            selectedApplicationIds.length > 0
                ? applications.filter((app) => selectedApplicationIds.includes(app?.id ?? ""))
                : applications;

        if (applicationsToExport.length === 0) {
            alert("Please select at least one application to export.");
            return;
        }

        const headers: (keyof Lead)[] = [
            "id", "name", "mobile", "email", "alternate_mobile", "type", "city",
            "purpose", "preferred_country", "status", "utm_source", "utm_medium",
            "utm_campaign", "assigned_to", "created_at",
        ];

        const csvContent = [
            headers.join(","),
            ...applicationsToExport.map(app =>
                headers.map(header => {
                    const value = app[header] ?? "";
                    const stringValue = String(value);
                    return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
                }).join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", `selected_applications_${new Date().toISOString().split('T')[0]}.csv`);
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
                    <p>No applications found. Start by adding a new application!</p>
                </div>
            );
        }

        return <LeadsTable leads={applications} selectedLeadIds={selectedApplicationIds} setSelectedLeadIds={setSelectedApplicationIds} />;
    }

    return (
        <div className="w-full">
            <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" disabled>
                            <Flag className="h-4 w-4 mr-2" /> Flagged
                        </Button>
                        <Button variant="secondary" size="sm" disabled>
                            <Filter className="h-4 w-4 mr-2" /> Apply Filters
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
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