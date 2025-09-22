"use client";

import { Dispatch, SetStateAction } from "react"; // Import new types
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox"; // Make sure to import your Checkbox component
import LeadsTableRow from "./leadsTableRow";
import { Lead } from "@/stores/useLeadStore";
import { useAuthStore } from "@/stores/useAuthStore";

interface LeadsTableProps {
    leads: Lead[];
    selectedLeadIds: string[];
    setSelectedLeadIds: Dispatch<SetStateAction<string[]>>;
}

export default function LeadsTable({ leads, selectedLeadIds, setSelectedLeadIds }: LeadsTableProps) {
    const { user } = useAuthStore()

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedLeadIds(leads.map((lead) => lead.id!));
        } else {
            setSelectedLeadIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedLeadIds((prev) => [...prev, id]);
        } else {
            setSelectedLeadIds((prev) => prev.filter((leadId) => leadId !== id));
        }
    };

    const areAllSelected = leads.length > 0 && selectedLeadIds.length === leads.length;

    return (
        <div className="w-full">
            <div className="max-h-[67vh] overflow-y-auto">
                <Table className="relative">
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={areAllSelected}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all"
                                    className="bg-white"
                                />
                            </TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Name/Phone</TableHead>
                            <TableHead>Lead Owner</TableHead>
                            <TableHead>Lead Type</TableHead>
                            <TableHead>Lead Source</TableHead>
                            <TableHead>Preferred Country</TableHead>
                            <TableHead>Lead Status</TableHead>
                            {user?.role === "admin" && (<TableHead className="text-center">Action</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map((lead) => (
                            <LeadsTableRow
                                key={lead.id}
                                lead={lead}
                                isSelected={selectedLeadIds.includes(lead.id!)}
                                onSelect={handleSelectOne}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}