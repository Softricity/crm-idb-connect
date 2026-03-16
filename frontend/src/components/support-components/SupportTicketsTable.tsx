"use client";

import {
  Chip,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { SupportTicket } from "@/stores/useSupportStore";

const statusColorMap: Record<string, "primary" | "secondary" | "success" | "warning" | "danger" | "default"> = {
  OPEN: "primary",
  IN_PROGRESS: "warning",
  AWAITING_REPLY: "secondary",
  RESOLVED: "success",
  CLOSED: "default",
};

const priorityColorMap: Record<string, "primary" | "secondary" | "success" | "warning" | "danger" | "default"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
  URGENT: "danger",
};

interface Props {
  tickets: SupportTicket[];
  loading?: boolean;
  onTicketClick: (ticket: SupportTicket) => void;
}

export default function SupportTicketsTable({ tickets, loading = false, onTicketClick }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">
        No support tickets found
      </div>
    );
  }

  return (
    <Table aria-label="Support tickets table">
      <TableHeader>
        <TableColumn>CASE #</TableColumn>
        <TableColumn>SUBJECT</TableColumn>
        <TableColumn>TOPIC</TableColumn>
        <TableColumn>CATEGORY</TableColumn>
        <TableColumn>CREATED BY</TableColumn>
        <TableColumn>PRIORITY</TableColumn>
        <TableColumn>STATUS</TableColumn>
        <TableColumn>CREATED</TableColumn>
      </TableHeader>
      <TableBody items={tickets}>
        {(ticket) => (
          <TableRow
            key={ticket.id}
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => onTicketClick(ticket)}
          >
            <TableCell>#{ticket.case_number}</TableCell>
            <TableCell>{ticket.subject}</TableCell>
            <TableCell>{ticket.topic}</TableCell>
            <TableCell>{ticket.category}</TableCell>
            <TableCell>{ticket.partner?.name || "-"}</TableCell>
            <TableCell>
              <Chip size="sm" variant="flat" color={priorityColorMap[ticket.priority] || "default"}>
                {ticket.priority}
              </Chip>
            </TableCell>
            <TableCell>
              <Chip size="sm" variant="flat" color={statusColorMap[ticket.status] || "default"}>
                {ticket.status.replace("_", " ")}
              </Chip>
            </TableCell>
            <TableCell>{new Date(ticket.created_at).toLocaleString()}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
