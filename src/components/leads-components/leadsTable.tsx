"use client";

import React, { Dispatch, SetStateAction, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Chip,
} from "@heroui/react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Lead, useLeadStore } from "@/stores/useLeadStore";
import { useAuthStore } from "@/stores/useAuthStore";
import LeadActionsMenu from "./tableActionCell";
import { ArrowRight, FlagIcon, Flag, UserCheck } from "lucide-react";
import { maskPhone, maskEmail } from "@/lib/maskingUtils";
import { ColumnConfig } from "./columnVisibilitySelector";
import { toast } from "sonner";
import { AssignCounsellorModal } from "./assignCounsellorModal";

const statusColorMap: { [key: string]: "primary" | "secondary" | "success" | "warning" | "danger" | "default" } = {
  new: "primary",
  interested: "secondary",
  inprocess: "warning",
  hot: "warning",
  engaged: "warning",
  contacted: "secondary",
  assigned: "success",
  cold: "default",
  rejected: "danger",
};

interface LeadsTableProps {
  leads: Lead[];
  selectedLeadIds: string[];
  setSelectedLeadIds: Dispatch<SetStateAction<string[]>>;
  columns: ColumnConfig[];
}

export default function LeadsTable({ leads, selectedLeadIds, setSelectedLeadIds, columns }: LeadsTableProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { updateLead, fetchLeads } = useLeadStore();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLeadForAssignment, setSelectedLeadForAssignment] = useState<Lead | null>(null);

  // Filter visible columns
  const visibleColumns = columns.filter((col) => col.isVisible);

  const handleToggleFlag = async (lead: Lead, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!lead.id) return;

    const newFlaggedState = !lead.is_flagged;
    
    try {
      await updateLead(lead.id, { is_flagged: newFlaggedState });
      toast.success(newFlaggedState ? "Lead flagged successfully" : "Lead unflagged successfully");
      // Refresh leads to update the UI
      await fetchLeads();
    } catch (error) {
      toast.error("Failed to update flag status");
      console.error("Error toggling flag:", error);
    }
  };

  const handleSelectionChange = (keys: "all" | Set<React.Key>) => {
    const currentLeadIdsOnTab = new Set(leads.map(lead => lead.id));
    
    const selectionsFromOtherTabs = selectedLeadIds.filter(id => !currentLeadIdsOnTab.has(id));
    
    let currentTabSelections: string[] = [];

    if (keys === "all") {
      currentTabSelections = leads.map(lead => lead.id).filter((id): id is string => typeof id === "string");
    } else {
      currentTabSelections = Array.from(keys).map(String);
    }

    const newTotalSelection = [...new Set([...selectionsFromOtherTabs, ...currentTabSelections])];
    
    setSelectedLeadIds(newTotalSelection);
  };  const renderCell = React.useCallback((lead: Lead, columnKey: React.Key) => {
    switch (columnKey) {
      case "date":
        return (
          <div className="text-xs text-gray-500 text-nowrap">
            {lead.created_at ? format(new Date(lead.created_at), "dd MMM yyyy, HH:mm") : "-"}
          </div>
        );
      case "name":
        return <span className="text-sm">{lead.name}</span>;
      case "phone":
        return <span className="text-sm">{maskPhone(lead.mobile)}</span>;
      case "email":
        return <span className="text-sm">{maskEmail(lead.email)}</span>;
      case "owner":
        return (
          <span className="text-sm">
            {lead.assigned_partner?.name || "Unassigned"}
          </span>
        );
      case "type":
        return (
          <Chip radius="sm" size="sm" variant="flat" className="capitalize">
            {lead?.purpose ?? "-"}
          </Chip>
        );
      case "source":
        return <span className="capitalize">{lead?.utm_source || "-"} / {lead?.utm_medium || "-"}</span>;
      case "country":
        return lead.preferred_country ?? "-";
      case "status":
        return (
          <Chip color={statusColorMap[lead.status?.toLowerCase()] || "default"} radius="sm" size="sm" variant="flat" className="capitalize">
            {lead.status}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Tooltip content={lead.is_flagged ? "Unflag" : "Flag"}>
              <button 
                type="button"
                aria-label={lead.is_flagged ? "Unflag lead" : "Flag lead"}
                className="cursor-pointer text-lg active:opacity-50 border-none bg-transparent p-0"
                onClick={(e) => handleToggleFlag(lead, e)}
              >
                {lead.is_flagged ? (
                  <Flag className="h-4 w-4 fill-red-500 text-red-500" />
                ) : (
                  <FlagIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                )}
              </button>
            </Tooltip>
            {user?.role === "admin" && (
              <Tooltip content="Assign Counsellor">
                <button
                  type="button"
                  aria-label="Assign counsellor"
                  className="cursor-pointer text-lg active:opacity-50 border-none bg-transparent p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLeadForAssignment(lead);
                    setIsAssignModalOpen(true);
                  }}
                >
                  <UserCheck className={`h-4 w-4 ${lead.assigned_to ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`} />
                </button>
              </Tooltip>
            )}
            <Tooltip content="Actions">
              <span className="cursor-pointer text-lg text-gray-500 active:opacity-50">
                <LeadActionsMenu leadId={lead.id || ""} />
              </span>
            </Tooltip>
            <Tooltip content="Go to Lead">
              <button
                type="button"
                aria-label="Go to lead details"
                className="cursor-pointer text-lg text-gray-500 active:opacity-50 border-none bg-transparent p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/leads/${lead.id}`);
                }}
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        );
      default:
        return lead[columnKey as keyof Lead] as string;
    }
  }, [router, handleToggleFlag]);

  return (
    <>
      <div className="max-h-[77vh] overflow-y-auto border rounded-lg">
        <Table
          aria-label="Table of leads"
          selectionMode="multiple"
          className="w-full overflow-auto"
          selectedKeys={selectedLeadIds}
          onSelectionChange={(keys) => handleSelectionChange(keys as "all" | Set<React.Key>)}
        >
          <TableHeader columns={visibleColumns.filter(col => user?.role === "admin" || col.uid !== 'actions')}>
            {(column) => (
              <TableColumn key={column.uid} align={column.uid === "actions" ? "end" : "start"}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={leads} emptyContent={"No leads found."}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => <TableCell className="text-nowrap">{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AssignCounsellorModal
        isOpen={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
        lead={selectedLeadForAssignment}
      />
    </>
  );
}