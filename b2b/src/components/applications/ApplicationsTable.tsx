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
} from "@heroui/react";
import { format } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { generateStudentPanelToken } from "@/utils/token";

export interface Lead {
  id: string;
  name: string;
  email: string;
  mobile: string;
  type?: string;
  preferred_course?: string;
  preferred_country?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

const statusColorMap: {
  [key: string]: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
} = {
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

interface ApplicationsTableProps {
  leads: Lead[];
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
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
}: ApplicationsTableProps) {
  const [studentPanelOpen, setStudentPanelOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleOpenStudentPanel = (lead: Lead) => {
    setSelectedLead(lead);
    setStudentPanelOpen(true);
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
  ];



  const renderCell = (lead: Lead, columnKey: React.Key) => {
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
            color={statusColorMap[lead.status?.toLowerCase()] || "default"}
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
          <div className="flex justify-end">
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
    </div>
  );
}
