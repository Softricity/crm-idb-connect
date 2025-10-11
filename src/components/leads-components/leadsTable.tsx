"use client";

import React, { Dispatch, SetStateAction } from "react";
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
import { Lead } from "@/stores/useLeadStore";
import { useAuthStore } from "@/stores/useAuthStore";
import LeadActionsMenu from "./tableActionCell";
import { ArrowRight, FlagIcon } from "lucide-react";

const columns = [
  { uid: "select", name: "" },
  { uid: "date", name: "Date" },
  { uid: "name", name: "Name/Phone" },
  { uid: "owner", name: "Lead Owner" },
  { uid: "type", name: "Lead Type" },
  { uid: "source", name: "Lead Source" },
  { uid: "country", name: "Preferred Country" },
  { uid: "status", name: "Lead Status" },
  { uid: "actions", name: "Action" },
];

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
}

export default function LeadsTable({ leads, selectedLeadIds, setSelectedLeadIds }: LeadsTableProps) {
  const router = useRouter();
  const { user } = useAuthStore();

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
  };

  const renderCell = React.useCallback((lead: Lead, columnKey: React.Key) => {
    switch (columnKey) {
      case "date":
        return (
          <div className="text-xs text-gray-500">
            {lead.created_at ? format(new Date(lead.created_at), "dd MMM yyyy, HH:mm") : "-"}
          </div>
        );
      case "name":
        return (
          <div>
            <div className="font-medium">{lead.name}</div>
            <div className="text-xs text-gray-500">{lead.mobile}</div>
          </div>
        );
      case "owner":
        return lead.assigned_to ?? "Unassigned";
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
          <div className="relative flex items-center justify-end gap-1">
            <Tooltip content="Flag">
              <span className="cursor-pointer text-lg text-gray-500 active:opacity-50">
                <FlagIcon className="h-4 w-4" />
              </span>
            </Tooltip>
            <Tooltip content="Actions">
              <span className="cursor-pointer text-lg text-gray-500 active:opacity-50">
                <LeadActionsMenu />
              </span>
            </Tooltip>
            <Tooltip content="Go to Lead">
              <span className="cursor-pointer text-lg text-gray-500 active:opacity-50" onClick={() => router.push(`/leads/${lead.id}`)}>
                <ArrowRight className="h-4 w-4" />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return lead[columnKey as keyof Lead] as string;
    }
  }, [router]);

  return (
    <div className="max-h-[77vh] overflow-y-auto border rounded-lg">
      <Table
        aria-label="Table of leads"
        selectionMode="multiple"
        selectedKeys={selectedLeadIds}
        onSelectionChange={(keys) => handleSelectionChange(keys as "all" | Set<React.Key>)}
      >
        <TableHeader columns={columns.filter(col => user?.role === "admin" || col.uid !== 'actions')}>
          {(column) => (
            <TableColumn key={column.uid} align={column.uid === "actions" ? "end" : "start"}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={leads} emptyContent={"No leads found."}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}