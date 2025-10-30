"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLeadStore, Lead } from "@/stores/useLeadStore";
import { format } from "date-fns";
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
import { Eye, Flag } from "lucide-react";
import { toast } from "sonner";

const statusColorMap: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  new: "primary",
  contacted: "secondary",
  qualified: "success",
  "not-interested": "danger",
  "follow-up": "warning",
};

export function CounsellorLeadsTable() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { leads, loading, getCounsellorLeads, updateLead } = useLeadStore();
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;

  React.useEffect(() => {
    if (user?.id) {
      getCounsellorLeads(user.id);
    }
  }, [getCounsellorLeads, user?.id]);

  // All leads are already filtered by counsellor ID from the store
  const myLeads = React.useMemo(() => {
    return leads;
  }, [leads]);

  const paginatedLeads = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return myLeads.slice(start, start + rowsPerPage);
  }, [myLeads, page]);

  const totalPages = Math.ceil(myLeads.length / rowsPerPage);

  const handleViewDetails = (leadId: string) => {
    router.push(`/counsellor/leads/${leadId}`);
  };

  const handleToggleFlag = async (e: React.MouseEvent, lead: Lead) => {
    e.preventDefault();
    e.stopPropagation();

    if (!lead.id) return;

    try {
      await updateLead(lead.id, { is_flagged: !lead.is_flagged });
      toast.success(lead.is_flagged ? "Lead unflagged" : "Lead flagged");
      if (user?.id) {
        getCounsellorLeads(user.id);
      }
    } catch (error) {
      toast.error("Failed to update flag");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Total Leads: {myLeads.length}</h2>
        </div>
      </div>

      <Table
        aria-label="Counsellor leads table"
        bottomContent={
          totalPages > 1 && (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={totalPages}
                onChange={setPage}
              />
            </div>
          )
        }
      >
        <TableHeader>
          <TableColumn>NAME</TableColumn>
          <TableColumn>EMAIL</TableColumn>
          <TableColumn>MOBILE</TableColumn>
          <TableColumn>PURPOSE</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>CREATED</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody items={paginatedLeads} emptyContent={"No leads assigned to you yet."}>
          {(lead) => (
            <TableRow key={lead.id} className="cursor-pointer hover:bg-gray-50">
              <TableCell>{lead.name}</TableCell>
              <TableCell>{lead.email}</TableCell>
              <TableCell>{lead.mobile}</TableCell>
              <TableCell className="capitalize">{lead.purpose}</TableCell>
              <TableCell>
                <Chip color={statusColorMap[lead.status] || "default"} size="sm" variant="flat">
                  {lead.status}
                </Chip>
              </TableCell>
              <TableCell>
                {lead.created_at ? format(new Date(lead.created_at), "MMM dd, yyyy") : "N/A"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleToggleFlag(e, lead)}
                    className="p-1 hover:bg-gray-100 rounded"
                    aria-label={lead.is_flagged ? "Unflag lead" : "Flag lead"}
                  >
                    <Flag
                      className={`h-4 w-4 ${
                        lead.is_flagged ? "fill-red-500 text-red-500" : "text-gray-400"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleViewDetails(lead.id!)}
                    className="p-1 hover:bg-gray-100 rounded"
                    aria-label="View details"
                  >
                    <Eye className="h-4 w-4 text-blue-500" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
