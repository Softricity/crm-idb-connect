"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { Download, Filter, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Lead, useLeadStore } from "@/stores/useLeadStore";
import LeadsTable from "../leads-components/leadsTable";
import ColumnVisibilitySelector, { ColumnConfig } from "../leads-components/columnVisibilitySelector";

// Default column configuration for applications
const DEFAULT_APPLICATION_COLUMNS: ColumnConfig[] = [
    { uid: "select", name: "", isVisible: true, isMandatory: true },
    { uid: "date", name: "Date", isVisible: true, isMandatory: true },
    { uid: "name", name: "Name", isVisible: true, isMandatory: true },
    { uid: "phone", name: "Phone", isVisible: false, isMandatory: false },
    { uid: "email", name: "Email", isVisible: false, isMandatory: false },
    { uid: "owner", name: "Lead Owner", isVisible: true, isMandatory: false },
    { uid: "type", name: "Lead Type", isVisible: false, isMandatory: false },
    { uid: "source", name: "Lead Source", isVisible: false, isMandatory: false },
    { uid: "country", name: "Preferred Country", isVisible: false, isMandatory: false },
    { uid: "status", name: "Lead Status", isVisible: true, isMandatory: false },
    { uid: "actions", name: "Action", isVisible: true, isMandatory: true },
];

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
    const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_APPLICATION_COLUMNS);
    const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);

    const handleColumnsChange = (updatedColumns: ColumnConfig[]) => {
        setColumns(updatedColumns);
    };
    
    // Filter applications based on flag toggle
    const filteredApplications = showOnlyFlagged 
        ? applications.filter(app => app.is_flagged === true)
        : applications;
    
    // Count flagged applications in current view
    const flaggedCount = filteredApplications.filter(app => app.is_flagged === true).length;

    const handleDownloadCSV = () => {
        const applicationsToExport =
            selectedApplicationIds.length > 0
                ? filteredApplications.filter((app) => selectedApplicationIds.includes(app?.id ?? ""))
                : filteredApplications;

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

        return <LeadsTable leads={filteredApplications} selectedLeadIds={selectedApplicationIds} setSelectedLeadIds={setSelectedApplicationIds} columns={columns} />;
    }

    return (
        <div className="w-full">
            <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant={showOnlyFlagged ? "default" : "secondary"}
                            size="sm"
                            onClick={() => setShowOnlyFlagged(!showOnlyFlagged)}
                            className={showOnlyFlagged ? "bg-primary text-white hover:bg-primary/90" : ""}
                        >
                            <Flag className={`h-4 w-4 mr-2 ${showOnlyFlagged ? 'fill-white' : 'fill-red-500'}`} />
                            {showOnlyFlagged ? 'Show All' : `Flagged (${flaggedCount})`}
                        </Button>
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