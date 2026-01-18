"use client";

import React from "react";
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
} from "@heroui/react";
import { format } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface Ticket {
  id: string;
  case_number: number;
  topic: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  partner?: {
    name: string;
  };
}

const statusColorMap: {
  [key: string]: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
} = {
  OPEN: "primary",
  IN_PROGRESS: "warning",
  AWAITING_REPLY: "secondary",
  RESOLVED: "success",
  CLOSED: "default",
};

const priorityColorMap: {
  [key: string]: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
} = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
  URGENT: "danger",
};

interface SupportTicketsTableProps {
  tickets: Ticket[];
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  onTicketClick?: (ticket: Ticket) => void;
  isAdmin?: boolean;
}

export default function SupportTicketsTable({
  tickets,
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  sortBy,
  sortOrder = 'desc',
  onSort,
  onTicketClick,
  isAdmin = false,
}: SupportTicketsTableProps) {

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
    { key: "case_number", label: "CASE #", sortable: true },
    { key: "subject", label: "SUBJECT", sortable: true },
    { key: "topic", label: "TOPIC", sortable: true },
    { key: "category", label: "CATEGORY", sortable: true },
    ...(isAdmin ? [{ key: "partner", label: "CREATED BY", sortable: true }] : []),
    { key: "priority", label: "PRIORITY", sortable: true },
    { key: "status", label: "STATUS", sortable: true },
    { key: "created_at", label: "DATE", sortable: true },
  ];

  const renderCell = (ticket: Ticket, columnKey: React.Key) => {
    switch (columnKey) {
      case "case_number":
        return <span className="text-sm font-semibold">#{ticket.case_number}</span>;

      case "subject":
        return <span className="text-sm font-medium">{ticket.subject}</span>;

      case "topic":
        return <span className="text-sm text-gray-600">{ticket.topic}</span>;

      case "category":
        return <span className="text-sm text-gray-600">{ticket.category}</span>;

      case "partner":
        return <span className="text-sm">{ticket.partner?.name || "-"}</span>;

      case "priority":
        return (
          <Chip
            color={priorityColorMap[ticket.priority] || "default"}
            radius="sm"
            size="sm"
            variant="flat"
            className="capitalize"
          >
            {ticket.priority}
          </Chip>
        );

      case "status":
        return (
          <Chip
            color={statusColorMap[ticket.status] || "default"}
            radius="sm"
            size="sm"
            variant="flat"
            className="capitalize"
          >
            {ticket.status.replace('_', ' ')}
          </Chip>
        );

      case "created_at":
        return (
          <div className="text-xs text-gray-600 text-nowrap">
            {ticket.created_at ? format(new Date(ticket.created_at), "dd MMM yyyy, HH:mm") : "-"}
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

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg font-semibold">No tickets found</p>
        <p className="text-sm mt-2">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table
        aria-label="Support tickets table"
        classNames={{
          wrapper: "shadow-md",
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn 
              key={column.key} 
              className="uppercase text-xs"
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
        <TableBody items={tickets}>
          {(ticket) => (
            <TableRow
              key={ticket.id}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onTicketClick?.(ticket)}
            >
              {(columnKey) => <TableCell>{renderCell(ticket, columnKey)}</TableCell>}
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
    </div>
  );
}
