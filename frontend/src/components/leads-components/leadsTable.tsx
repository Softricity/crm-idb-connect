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
import { ArrowRight, FlagIcon, Flag, Eye, EyeOff } from "lucide-react";
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

  // track which lead has phone/email visible
  const [visibleData, setVisibleData] = useState<{ [key: string]: boolean }>({});

  const visibleColumns = columns.filter((col) => col.isVisible);

  const handleToggleFlag = async (lead: Lead, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!lead.id) return;
    const newFlaggedState = !lead.is_flagged;

    try {
      await updateLead(lead.id, { is_flagged: newFlaggedState });
      toast.success(newFlaggedState ? "Lead flagged successfully" : "Lead unflagged successfully");
      await fetchLeads();
    } catch (error) {
      toast.error("Failed to update flag status");
      console.error("Error toggling flag:", error);
    }
  };

  const toggleVisibility = (leadId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setVisibleData((prev) => ({
      ...prev,
      [leadId]: !prev[leadId],
    }));
  };

  const handleSelectionChange = (keys: "all" | Set<React.Key>) => {
    const currentLeadIdsOnTab = new Set(leads.map((lead) => lead.id));
    const selectionsFromOtherTabs = selectedLeadIds.filter((id) => !currentLeadIdsOnTab.has(id));

    let currentTabSelections: string[] = [];

    if (keys === "all") {
      currentTabSelections = leads.map((lead) => lead.id).filter((id): id is string => typeof id === "string");
    } else {
      currentTabSelections = Array.from(keys).map(String);
    }

    const newTotalSelection = [...new Set([...selectionsFromOtherTabs, ...currentTabSelections])];

    setSelectedLeadIds(newTotalSelection);
  };

  const renderCell = React.useCallback(
    (lead: Lead, columnKey: React.Key) => {
      const showFull = visibleData[lead.id || ""];

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
          return (
            <span
              className="text-sm cursor-pointer select-none"
              onClick={(e) => toggleVisibility(lead.id || "", e)}
            >
              {showFull ? lead.mobile : maskPhone(lead.mobile)}
            </span>
          );

        case "email":
          return (
            <span
              className="text-sm cursor-pointer select-none"
              onClick={(e) => toggleVisibility(lead.id || "", e)}
            >
              {showFull ? lead.email : maskEmail(lead.email)}
            </span>
          );

        case "owner":
          return <span className="text-sm">{lead.partners_leads_assigned_toTopartners?.name || "Unassigned"}</span>;

        case "type":
          return (
            <Chip radius="sm" size="sm" variant="flat" className="capitalize">
              {lead?.type ?? "-"}
            </Chip>
          );

        case "source":
          return (
            <span className="capitalize">
              {lead?.utm_source || "-"} / {lead?.utm_medium || "-"} / {lead?.utm_campaign || "-"}
            </span>
          );

        case "country":
          return lead.preferred_country ?? "-";

        case "status":
          return (
            <Chip
              color={statusColorMap[lead.status?.toLowerCase()] || "default"}
              radius="sm"
              size="sm"
              variant="flat"
              className="capitalize"
            >
              {lead.status}
            </Chip>
          );

        case "actions":
          return (
            <div
              className="relative flex items-center justify-end gap-2"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              {/*  Flag Icon */}
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

              {/* Eye Icon - now RIGHT side of flag */}
              <Tooltip content={showFull ? "Hide Email & Phone" : "Show Email & Phone"}>
                <button
                  type="button"
                  aria-label="Toggle sensitive info"
                  className="cursor-pointer text-lg text-gray-500 hover:text-gray-700 active:opacity-50 border-none bg-transparent p-0"
                  onClick={(e) => toggleVisibility(lead.id || "", e)}
                >
                  {showFull ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Tooltip>

              {/* Actions Menu */}
              <Tooltip content="Actions">
                <span
                  className="cursor-pointer text-lg text-gray-500 active:opacity-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LeadActionsMenu
                    leadId={lead.id || ""}
                    lead={lead}
                    showAssign={(user?.permissions || []).includes("Lead Assignment")}
                    userRole={user?.role}
                    onAssignClick={() => {
                      setSelectedLeadForAssignment(lead);
                      setIsAssignModalOpen(true);
                    }}
                  />
                </span>
              </Tooltip>

              {/* Go to Lead */}
              <Tooltip content="Go to Lead">
                <button
                  type="button"
                  aria-label="Go to lead details"
                  className="cursor-pointer text-lg text-gray-500 active:opacity-50 border-none bg-transparent p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    // All users use /leads path (B2B users are handled by middleware)
                    const basePath = "/leads";
                    router.push(`${basePath}/${lead.id}`);
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
    },
    [router, handleToggleFlag, visibleData]
  );

  return (
    <>
      <div className="max-h-[77vh] overflow-y-auto border rounded-lg">
        <Table
          key={JSON.stringify(visibleData)} 
          aria-label="Table of leads"
          selectionMode="multiple"
          className="w-full overflow-auto"
          selectedKeys={selectedLeadIds}
          onSelectionChange={(keys) => handleSelectionChange(keys as "all" | Set<React.Key>)}
          onRowAction={(key) => console.log("Row clicked:", key)}
        >
          <TableHeader columns={visibleColumns}>
            {(column) => (
              <TableColumn key={column.uid} align={column.uid === "actions" ? "end" : "start"}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={leads} emptyContent={"No leads found."}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell className="text-nowrap">{renderCell(item, columnKey)}</TableCell>
                )}
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
