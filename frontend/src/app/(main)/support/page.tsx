"use client";

import { useEffect, useMemo, useState } from "react";
import { Input, Select, SelectItem } from "@heroui/react";
import { Search } from "lucide-react";
import { PermissionGuard } from "@/components/PermissionGuard";
import SupportTicketsTable from "@/components/support-components/SupportTicketsTable";
import SupportTicketDetailModal from "@/components/support-components/SupportTicketDetailModal";
import { SupportTicket, useSupportStore } from "@/stores/useSupportStore";
import { hasAnyPermission, SupportPermission } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "AWAITING_REPLY", label: "Awaiting Reply" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const SUPPORT_VIEW_PERMS = [
  SupportPermission.SUPPORT_TICKET_VIEW,
  SupportPermission.SUPPORT_TICKET_MANAGE,
];

export default function SupportPage() {
  const { user } = useAuthStore();
  const { tickets, loading, fetchTickets } = useSupportStore();
  const [selectedStatus, setSelectedStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const canReply = hasAnyPermission(user?.permissions || [], [
    SupportPermission.SUPPORT_TICKET_REPLY,
    SupportPermission.SUPPORT_TICKET_MANAGE,
  ]);
  const canUpdateStatus = hasAnyPermission(user?.permissions || [], [
    SupportPermission.SUPPORT_TICKET_STATUS_UPDATE,
    SupportPermission.SUPPORT_TICKET_MANAGE,
  ]);

  useEffect(() => {
    fetchTickets(selectedStatus || undefined);
  }, [selectedStatus, fetchTickets]);

  const filteredTickets = useMemo(() => {
    if (!search.trim()) return tickets;
    const searchLower = search.toLowerCase();
    return tickets.filter((ticket) => {
      return (
        ticket.subject?.toLowerCase().includes(searchLower) ||
        ticket.topic?.toLowerCase().includes(searchLower) ||
        ticket.category?.toLowerCase().includes(searchLower) ||
        ticket.partner?.name?.toLowerCase().includes(searchLower) ||
        ticket.case_number?.toString().includes(search.trim())
      );
    });
  }, [tickets, search]);

  return (
    <PermissionGuard requiredPermissions={SUPPORT_VIEW_PERMS} showUnauthorized>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-600">Track and manage support tickets from B2B and CRM users.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-3">
          <Select
            label="Status"
            selectedKeys={selectedStatus ? [selectedStatus] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              setSelectedStatus(value || "");
            }}
          >
            {statusOptions.map((option) => (
              <SelectItem key={option.value}>{option.label}</SelectItem>
            ))}
          </Select>

          <Input
            className="md:col-span-2"
            label="Search"
            placeholder="Search by case #, subject, topic, category, created by..."
            startContent={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            isClearable
            onClear={() => setSearch("")}
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-2">
          <SupportTicketsTable
            tickets={filteredTickets}
            loading={loading}
            onTicketClick={(ticket) => {
              setSelectedTicket(ticket);
              setModalOpen(true);
            }}
          />
        </div>

        <SupportTicketDetailModal
          ticket={selectedTicket}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedTicket(null);
          }}
          canReply={canReply}
          canUpdateStatus={canUpdateStatus}
        />
      </div>
    </PermissionGuard>
  );
}
