"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { Download, Filter, X } from "lucide-react";
import { Button, Input, Select, SelectItem, Skeleton, Table, TableHeader, TableBody, TableRow, TableColumn as TableHead, TableCell } from "@heroui/react";
import LeadsTable from "@/components/leads-components/leadsTable";
import { Application, useApplicationStore } from "@/stores/useApplicationStore";
import ColumnVisibilitySelector, { ColumnConfig } from "../leads-components/columnVisibilitySelector";
import Link from "next/link";

// Default column configuration for applications with extended fields
const DEFAULT_APPLICATION_COLUMNS: ColumnConfig[] = [
    { uid: "select", name: "", isVisible: true, isMandatory: true },
    { uid: "date", name: "Date", isVisible: true, isMandatory: true },
    { uid: "name", name: "Name", isVisible: true, isMandatory: true },
    { uid: "phone", name: "Phone", isVisible: true, isMandatory: false },
    { uid: "email", name: "Email", isVisible: true, isMandatory: false },
    { uid: "dob", name: "Date of Birth", isVisible: false, isMandatory: false },
    { uid: "gender", name: "Gender", isVisible: false, isMandatory: false },
    { uid: "citizenship", name: "Citizenship", isVisible: false, isMandatory: false },
    { uid: "country", name: "Country", isVisible: false, isMandatory: false },
    { uid: "application_stage", name: "Application Stage", isVisible: true, isMandatory: false },
    { uid: "preferred_country", name: "Preferred Country", isVisible: true, isMandatory: false },
    { uid: "preferred_course", name: "Preferred Course", isVisible: false, isMandatory: false },
    { uid: "preferred_intake", name: "Preferred Intake", isVisible: false, isMandatory: false },
    { uid: "student_id", name: "Student ID", isVisible: false, isMandatory: false },
    { uid: "marital_status", name: "Marital Status", isVisible: false, isMandatory: false },
    { uid: "current_status", name: "Current Status", isVisible: false, isMandatory: false },
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
    const [filters, setFilters] = useState({
        search: "",
        application_stage: "",
        preferred_country: "",
        gender: "",
        citizenship: "",
    });
    const [showFilters, setShowFilters] = useState(false);

    const handleColumnsChange = (updatedColumns: ColumnConfig[]) => {
        setColumns(updatedColumns);
    };

    // Filter applications based on current filters
    const filteredApplications = applications.filter(app => {
        const name = `${app.given_name || ''} ${app.surname || ''}`.toLowerCase();
        const email = (app.email || '').toLowerCase();
        const phone = (app.phone || '').toLowerCase();
        const searchMatch = !filters.search || 
            name.includes(filters.search.toLowerCase()) ||
            email.includes(filters.search.toLowerCase()) ||
            phone.includes(filters.search.toLowerCase());

        const stageMatch = !filters.application_stage || app.application_stage === filters.application_stage;
        const countryMatch = !filters.preferred_country || (app.preferences?.[0]?.preferred_country === filters.preferred_country || app.country === filters.preferred_country);
        const genderMatch = !filters.gender || app.gender === filters.gender;
        const citizenshipMatch = !filters.citizenship || app.citizenship === filters.citizenship;

        return searchMatch && stageMatch && countryMatch && genderMatch && citizenshipMatch;
    });

    const handleClearFilters = () => {
        setFilters({
            search: "",
            application_stage: "",
            preferred_country: "",
            gender: "",
            citizenship: "",
        });
    };

    const handleDownloadCSV = () => {
        const applicationsToExport =
            selectedApplicationIds.length > 0
                ? filteredApplications.filter((app) => selectedApplicationIds.includes(app?.id ?? ""))
                : filteredApplications;

        if (applicationsToExport.length === 0) {
            alert("Please select at least one application to export.");
            return;
        }

        const headers = [
            "id", "student_id", "lead_id", "given_name", "surname", "email", "phone",
            "citizenship", "application_stage", "dob", "gender", "marital_status", 
            "country", "preferred_country", "created_at"
        ];

        const csvContent = [
            headers.join(","),
            ...applicationsToExport.map(app =>
                headers.map(header => {
                    let value = (app as any)[header] ?? "";
                    // Handle nested preferences
                    if (header === "preferred_country" && app.preferences?.[0]?.preferred_country) {
                        value = app.preferences[0].preferred_country;
                    }
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

        if (!filteredApplications || filteredApplications.length === 0) {
            return (
                <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
                    <div className="text-center">
                        <p className="mb-2">
                            {applications.length === 0 
                                ? "No applications found. Applications are created when leads are converted."
                                : "No applications match your filters."}
                        </p>
                        {applications.length > 0 && filteredApplications.length === 0 && (
                            <Button variant="solid" size="sm" onPress={handleClearFilters}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>
            );
        }

        // Map applications to leads shape for table reuse with extended fields
        const leads = (filteredApplications as any[]).map(app => ({
            id: app.lead_id || app.id || '',
            name: [app.given_name, app.surname].filter(Boolean).join(' ') || '-',
            email: app.email || '-',
            mobile: app.phone || '-',
            type: 'application',
            preferred_country: app.preferences?.[0]?.preferred_country || app.country || '-',
            preferred_course: app.preferences?.[0]?.preferred_course_name || '-',
            preferred_intake: app.preferences?.[0]?.preferred_intake || '-',
            status: app.application_stage || '-',
            dob: app.dob || '-',
            gender: app.gender || '-',
            citizenship: app.citizenship || '-',
            student_id: app.student_id || '-',
            marital_status: app.marital_status || '-',
            current_status: app.current_status || '-',
            application_stage: app.application_stage || '-',
            created_at: app.created_at,
            utm_source: '',
            utm_medium: '',
            utm_campaign: '',
            assigned_to: app.assigned_to,
            created_by: app.created_by || '',
            agent_id: app.agent_id || '',
            reason: '',
            password: '',
            is_flagged: app.is_flagged || false,
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
            <div className="mt-5 flex flex-col gap-3">
                {/* Top bar with filter toggle and actions */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Button 
                            color={showFilters ? "primary" : "default"} 
                            size="sm" 
                            onPress={() => setShowFilters(!showFilters)}
                            startContent={<Filter className="h-4 w-4" />}
                        >
                            {showFilters ? "Hide Filters" : "Show Filters"}
                        </Button>
                        {(filters.search || filters.application_stage || filters.preferred_country || filters.gender || filters.citizenship) && (
                            <Button 
                                variant="bordered" 
                                size="sm" 
                                onPress={handleClearFilters}
                                startContent={<X className="h-4 w-4" />}
                            >
                                Clear Filters
                            </Button>
                        )}
                        <span className="text-sm text-default-500">
                            {filteredApplications.length} of {applications.length} applications
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ColumnVisibilitySelector
                            columns={columns}
                            onColumnsChange={handleColumnsChange}
                            storageKey="applications_column_visibility"
                        />
                        <Button 
                            variant="bordered" 
                            size="sm" 
                            onPress={handleDownloadCSV}
                            startContent={<Download className="h-4 w-4" />}
                        >
                            {selectedApplicationIds.length > 0
                                ? `Download (${selectedApplicationIds.length}) Selected`
                                : 'Download CSV'}
                        </Button>
                    </div>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div className="bg-default-100 p-4 rounded-lg border border-default-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            <Input
                                label="Search"
                                placeholder="Search by name, email, phone..."
                                value={filters.search}
                                onValueChange={(value) => setFilters({ ...filters, search: value })}
                                variant="bordered"
                                className="bg-white rounded-xl"
                            />
                            <Select
                                label="Application Stage"
                                placeholder="Application Stage"
                                selectedKeys={filters.application_stage ? [filters.application_stage] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as string;
                                    setFilters({ ...filters, application_stage: value === ' ' ? '' : value });
                                }}
                                variant="bordered"
                                className="bg-white rounded-xl"
                            >
                                <SelectItem key=" ">All Stages</SelectItem>
                                <SelectItem key="Profile Building">Profile Building</SelectItem>
                                <SelectItem key="Document Collection">Document Collection</SelectItem>
                                <SelectItem key="University Shortlisting">University Shortlisting</SelectItem>
                                <SelectItem key="Application Submitted">Application Submitted</SelectItem>
                                <SelectItem key="Offer Received">Offer Received</SelectItem>
                                <SelectItem key="Visa Processing">Visa Processing</SelectItem>
                                <SelectItem key="Visa Approved">Visa Approved</SelectItem>
                                <SelectItem key="Enrolled">Enrolled</SelectItem>
                            </Select>
                            <Select
                                label="Preferred Country"
                                placeholder="Preferred Country"
                                selectedKeys={filters.preferred_country ? [filters.preferred_country] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as string;
                                    setFilters({ ...filters, preferred_country: value === ' ' ? '' : value });
                                }}
                                variant="bordered"
                                className="bg-white rounded-xl"
                            >
                                <SelectItem key=" ">All Countries</SelectItem>
                                <SelectItem key="USA">USA</SelectItem>
                                <SelectItem key="UK">UK</SelectItem>
                                <SelectItem key="Canada">Canada</SelectItem>
                                <SelectItem key="Australia">Australia</SelectItem>
                                <SelectItem key="Germany">Germany</SelectItem>
                                <SelectItem key="Ireland">Ireland</SelectItem>
                                <SelectItem key="New Zealand">New Zealand</SelectItem>
                            </Select>
                            <Select
                                label="Gender"
                                placeholder="Gender"
                                selectedKeys={filters.gender ? [filters.gender] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as string;
                                    setFilters({ ...filters, gender: value === ' ' ? '' : value });
                                }}
                                variant="bordered"
                                className="bg-white rounded-xl"
                            >
                                <SelectItem key=" ">All Genders</SelectItem>
                                <SelectItem key="Male">Male</SelectItem>
                                <SelectItem key="Female">Female</SelectItem>
                                <SelectItem key="Other">Other</SelectItem>
                            </Select>
                            <Select
                                label="Citizenship"
                                placeholder="Citizenship"
                                selectedKeys={filters.citizenship ? [filters.citizenship] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as string;
                                    setFilters({ ...filters, citizenship: value === ' ' ? '' : value });
                                }}
                                variant="bordered"
                                className="bg-white rounded-xl"
                            >
                                <SelectItem key=" ">All Citizenships</SelectItem>
                                <SelectItem key="Indian">Indian</SelectItem>
                                <SelectItem key="Nepali">Nepali</SelectItem>
                                <SelectItem key="Bangladeshi">Bangladeshi</SelectItem>
                                <SelectItem key="Pakistani">Pakistani</SelectItem>
                                <SelectItem key="Sri Lankan">Sri Lankan</SelectItem>
                            </Select>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
    );
}

function ApplicationsTableSkeleton() {
    return (
        <div className="w-full flex items-center justify-center py-20">
            <div className="text-center space-y-4">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="text-default-500">Loading applications...</p>
            </div>
        </div>
    );
}