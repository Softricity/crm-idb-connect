"use client";

import { useEffect, useState } from "react";
import { PermissionGuard } from "@/components/PermissionGuard";
import { CommissionPermission } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { CommissionsAPI } from "@/lib/api";
import { Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface Commission {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  remarks?: string;
  created_at: string;
  lead?: {
    id: string;
    name: string;
    email: string;
  };
  application?: {
    id: string;
  };
  agent?: {
    id: string;
    name: string;
    agency_name?: string;
    email: string;
  };
}

const statusColorMap = {
  PAID: "success",
  APPROVED: "primary",
  PENDING: "warning",
  REJECTED: "danger",
} as const;

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [filteredCommissions, setFilteredCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchCommissions();
  }, []);

  useEffect(() => {
    filterCommissions();
  }, [searchQuery, statusFilter, commissions]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const data = await CommissionsAPI.getAll();
      setCommissions(data || []);
    } catch (error: any) {
      console.error("Failed to fetch commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCommissions = () => {
    let filtered = [...commissions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (commission) =>
          commission.lead?.name?.toLowerCase().includes(query) ||
          commission.lead?.email?.toLowerCase().includes(query) ||
          commission.agent?.name?.toLowerCase().includes(query) ||
          commission.agent?.agency_name?.toLowerCase().includes(query) ||
          commission.remarks?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((commission) => commission.status === statusFilter);
    }

    setFilteredCommissions(filtered);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const calculateTotals = () => {
    const totals = filteredCommissions.reduce(
      (acc, commission) => {
        const amount = Number(commission.amount) || 0;
        if (!acc[commission.currency]) {
          acc[commission.currency] = { total: 0, paid: 0, pending: 0, approved: 0 };
        }
        acc[commission.currency].total += amount;
        if (commission.status === "PAID") {
          acc[commission.currency].paid += amount;
        } else if (commission.status === "PENDING") {
          acc[commission.currency].pending += amount;
        } else if (commission.status === "APPROVED") {
          acc[commission.currency].approved += amount;
        }
        return acc;
      },
      {} as Record<string, { total: number; paid: number; pending: number; approved: number }>
    );
    return totals;
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <PermissionGuard requiredPermissions={[CommissionPermission.COMMISSION_MANAGE]}>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" label="Loading commissions..." />
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard requiredPermissions={[CommissionPermission.COMMISSION_MANAGE]}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold">Commissions</h1>
              <p className="text-gray-600 mt-1">
                Manage and track all agent commissions
              </p>
            </div>
            <Button
              color="primary"
              startContent={<RefreshCw className="w-4 h-4" />}
              onPress={fetchCommissions}
              isLoading={loading}
            >
              Refresh
            </Button>
          </div>

          {/* Summary Cards */}
          {Object.keys(totals).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Object.entries(totals).map(([currency, amounts]) => (
                <Card key={currency} className="shadow-md">
                  <CardBody>
                    <p className="text-sm text-gray-600 mb-1">Total ({currency})</p>
                    <p className="text-2xl font-bold">{amounts.total.toLocaleString()}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-green-600">Paid:</span>
                        <span className="font-medium">{amounts.paid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Approved:</span>
                        <span className="font-medium">{amounts.approved.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-600">Pending:</span>
                        <span className="font-medium">{amounts.pending.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search by agent, lead, or remarks..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search className="w-4 h-4 text-gray-400" />}
                className="flex-1"
                isClearable
                onClear={() => setSearchQuery("")}
              />
              <Select
                placeholder="Filter by status"
                selectedKeys={statusFilter ? [statusFilter] : []}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-48"
              >
                <SelectItem key="">All Statuses</SelectItem>
                <SelectItem key="PENDING">Pending</SelectItem>
                <SelectItem key="APPROVED">Approved</SelectItem>
                <SelectItem key="PAID">Paid</SelectItem>
                <SelectItem key="REJECTED">Rejected</SelectItem>
              </Select>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredCommissions.length} of {commissions.length} commissions
            </p>
          </CardBody>
        </Card>

        {/* Table */}
        <Card>
          <CardBody>
            <Table aria-label="Commissions table">
              <TableHeader>
                <TableColumn>DATE</TableColumn>
                <TableColumn>AGENT</TableColumn>
                <TableColumn>LEAD/APPLICATION</TableColumn>
                <TableColumn>AMOUNT</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>REMARKS</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={
                  commissions.length === 0
                    ? "No commissions found"
                    : "No commissions match your filters"
                }
              >
                {filteredCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {formatDate(commission.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {commission.agent && (
                        <div>
                          <p className="font-medium text-gray-900">
                            {commission.agent.name}
                          </p>
                          {commission.agent.agency_name && (
                            <p className="text-xs text-gray-500">
                              {commission.agent.agency_name}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {commission.agent.email}
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {commission.lead && (
                        <div>
                          <p className="font-medium text-gray-900">
                            {commission.lead.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {commission.lead.email}
                          </p>
                        </div>
                      )}
                      {commission.application && (
                        <p className="text-sm text-gray-500">
                          Application: {commission.application.id.slice(0, 8)}...
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900">
                        {commission.currency} {Number(commission.amount).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={statusColorMap[commission.status] || "default"}
                        variant="flat"
                        size="sm"
                      >
                        {commission.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {commission.remarks || "-"}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </PermissionGuard>
  );
}
