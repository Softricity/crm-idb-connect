"use client";

import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Pagination,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Tooltip,
  Select,
  SelectItem,
} from "@heroui/react";
import { format } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Repeat } from "lucide-react";
import { generateStudentPanelToken } from "@/utils/token";
import { ForwardDepartmentModal } from "./ForwardDepartmentModal";

type ChipColor = "primary" | "secondary" | "success" | "warning" | "danger" | "default";

export interface DepartmentStatusConfig {
  key: string;
  label: string;
  order_index: number;
  is_default?: boolean;
  is_terminal?: boolean;
  is_active?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  mobile: string;
  type?: string;
  preferred_course?: string;
  preferred_country?: string;
  status: string;
  current_department_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  can_forward_to_next_department?: boolean;
}

const fallbackStatusColorMap: Record<string, ChipColor> = {
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

const normalizeStatusToken = (value?: string | null) =>
  (value || "").toString().trim().toLowerCase();

const getStatusColor = (
  statusValue: string | null | undefined,
  departmentStatuses: DepartmentStatusConfig[],
): ChipColor => {
  const token = normalizeStatusToken(statusValue);
  if (!token) {
    return "default";
  }

  const matchedStatus = departmentStatuses.find((status) => {
    const keyToken = normalizeStatusToken(status.key);
    const labelToken = normalizeStatusToken(status.label);
    return token === keyToken || token === labelToken;
  });

  if (matchedStatus?.is_terminal) {
    return "danger";
  }

  if (matchedStatus?.is_default) {
    return "primary";
  }

  if (matchedStatus) {
    if ((matchedStatus.order_index ?? 0) <= 1) {
      return "secondary";
    }
    if ((matchedStatus.order_index ?? 0) <= 3) {
      return "warning";
    }
    return "success";
  }

  return fallbackStatusColorMap[token] || "default";
};

interface ApplicationsTableProps {
  leads: Lead[];
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  teamMembers?: { id: string; name: string }[];
  onAssignTeamMember?: (leadId: string, teamMemberId: string) => Promise<void> | void;
  hideTeamAssignment?: boolean;
  departmentStatuses?: DepartmentStatusConfig[];
  onForwarded?: () => void | Promise<void>;
}

export default function ApplicationsTable({
  leads,
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  sortBy,
  sortOrder = 'desc',
  onSort,
  teamMembers = [],
  onAssignTeamMember,
  hideTeamAssignment = false,
  departmentStatuses = [],
  onForwarded,
}: ApplicationsTableProps) {
  const [studentPanelOpen, setStudentPanelOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardLead, setForwardLead] = useState<Lead | null>(null);

  const handleOpenStudentPanel = (lead: Lead) => {
    setSelectedLead(lead);
    setStudentPanelOpen(true);
  };

  const handleOpenForwardModal = (lead: Lead) => {
    setForwardLead(lead);
    setForwardModalOpen(true);
  };

  const studentPanelToken = () => {
    if (!selectedLead) return "";
    return generateStudentPanelToken({ 
      id: selectedLead.id, 
      email: selectedLead.email, 
      name: selectedLead.name 
    });
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  const columns = [
    { key: "created_at", label: "DATE", sortable: true },
    { key: "name", label: "NAME", sortable: true },
    { key: "mobile", label: "PHONE", sortable: false },
    { key: "type", label: "TYPE", sortable: true },
    { key: "preferred_course", label: "COURSE", sortable: true },
    { key: "preferred_country", label: "COUNTRY", sortable: true },
    { key: "status", label: "STATUS", sortable: true },
    { key: "actions", label: "ACTIONS", sortable: false },
  ].concat(!hideTeamAssignment && teamMembers.length > 0 ? [{ key: "team", label: "TEAM ASSIGN", sortable: false }] : []);

  const renderCell = (lead: Lead, columnKey: React.Key) => {
    const canForward = Boolean(lead.can_forward_to_next_department);

    switch (columnKey) {
      case "created_at":
        return (
          <div className="text-xs text-gray-600 text-nowrap">
            {lead.created_at ? format(new Date(lead.created_at), "dd MMM yyyy, HH:mm") : "-"}
          </div>
        );

      case "name":
        return <span className="text-sm font-semibold flex flex-col">{lead.name} <span className="font-medium">{lead.email}</span></span>;

      case "mobile":
        return <span className="text-sm text-gray-600">{lead.mobile}</span>;

      case "type":
        return (
          <Chip radius="sm" size="sm" variant="flat" className="capitalize">
            {lead.type || "Lead"}
          </Chip>
        );

      case "preferred_course":
        return <span className="text-sm">{lead.preferred_course || "-"}</span>;

      case "preferred_country":
        return <span className="text-sm">{lead.preferred_country || "-"}</span>;

      case "status":
        return (
          <Chip
            color={getStatusColor(lead.status, departmentStatuses)}
            radius="sm"
            size="sm"
            variant="flat"
            className="capitalize"
          >
            {lead.status}
          </Chip>
        );

      case "updated_at":
        return (
          <div className="text-xs text-gray-600 text-nowrap">
            {lead.updated_at ? format(new Date(lead.updated_at), "dd MMM yyyy, HH:mm") : "-"}
          </div>
        );

      case "actions":
        return (
          <div className="flex justify-end gap-1">
            {canForward && (
              <Tooltip content="Forward To Next Department">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="primary"
                  onPress={() => handleOpenForwardModal(lead)}
                >
                  <Repeat className="w-4 h-4" />
                </Button>
              </Tooltip>
            )}

            <Tooltip content="Open Student Panel">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="secondary"
                onPress={() => handleOpenStudentPanel(lead)}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        );

      case "team":
        return (
          <Select
            size="sm"
            placeholder="Assign member"
            selectedKeys={[]}
            isDisabled={assigningLeadId === lead.id}
            onChange={async (e) => {
              const teamMemberId = e.target.value;
              if (!teamMemberId || !onAssignTeamMember) return;
              try {
                setAssigningLeadId(lead.id);
                await onAssignTeamMember(lead.id, teamMemberId);
              } finally {
                setAssigningLeadId(null);
              }
            }}
            className="min-w-[180px]"
          >
            {teamMembers.map((m) => (
              <SelectItem key={m.id}>{m.name}</SelectItem>
            ))}
          </Select>
        );

      default:
        return "-";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg font-semibold">No applications found</p>
        <p className="text-sm mt-2">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table
        aria-label="Applications table"
        classNames={{
          wrapper: "shadow-md",
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn 
              key={column.key} 
              className="uppercase text-xs"
              align={column.key === "actions" ? "end" : "start"}
            >
              {column.sortable && onSort ? (
                <button
                  onClick={() => onSort(column.key)}
                  className="flex items-center hover:text-primary transition-colors font-semibold"
                >
                  {column.label}
                  {renderSortIcon(column.key)}
                </button>
              ) : (
                <span className="font-semibold">{column.label}</span>
              )}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={leads}>
          {(lead) => (
            <TableRow
              key={lead.id}
              className="hover:bg-gray-50 transition-colors"
            >
              {(columnKey) => <TableCell>{renderCell(lead, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={onPageChange}
            showControls
            color="primary"
          />
        </div>
      )}

      {/* Student Panel Modal */}
      <Modal 
        isOpen={studentPanelOpen} 
        onOpenChange={setStudentPanelOpen}
        size="full"
        classNames={{
          base: "max-w-7xl h-[90vh]",
          body: "p-0",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Student Panel - {selectedLead?.name}
              </ModalHeader>
              <ModalBody>
                <iframe
                  src={`https://student.idbconnect.global/login?token=${encodeURIComponent(studentPanelToken())}`}
                  title="Student Panel"
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <ForwardDepartmentModal
        isOpen={forwardModalOpen}
        onOpenChange={setForwardModalOpen}
        lead={forwardLead}
        onForwarded={onForwarded}
      />
    </div>
  );
}
