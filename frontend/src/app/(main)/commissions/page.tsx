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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { CommissionsAPI } from "@/lib/api";
import { Search, RefreshCw, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import CommissionModal from "@/components/leads-components/CommissionModal";
import { toast } from "sonner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";

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
    branch?: { id: string; name: string };
    category?: { id: string; name: string; label?: string };
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
  
  // CRUD state
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [commissionToDelete, setCommissionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
          commission.agent?.branch?.name?.toLowerCase().includes(query) ||
          commission.agent?.category?.label?.toLowerCase().includes(query) ||
          commission.agent?.category?.name?.toLowerCase().includes(query) ||
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

  const handleEdit = (commission: Commission) => {
    setSelectedCommission(commission);
    onModalOpen();
  };

  const handleDeleteClick = (id: string) => {
    setCommissionToDelete(id);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!commissionToDelete) return;
    try {
      setIsDeleting(true);
      await CommissionsAPI.delete(commissionToDelete);
      toast.success("Commission deleted successfully");
      fetchCommissions();
      onDeleteClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete commission");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await CommissionsAPI.update(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchCommissions();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

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
              <p className="text-gray-600 mt-1">
                Manage and track commissions by agent, branch, and category
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="flat"
                startContent={<RefreshCw className="w-4 h-4" />}
                onPress={fetchCommissions}
                isLoading={loading}
              >
                Refresh
              </Button>
            </div>
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
                <TableColumn align="center">ACTIONS</TableColumn>
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
                          <div className="flex flex-wrap gap-1 mt-1">
                            {commission.agent.branch?.name && (
                              <Chip size="sm" variant="flat" color="default">
                                Branch: {commission.agent.branch.name}
                              </Chip>
                            )}
                            {(commission.agent.category?.label || commission.agent.category?.name) && (
                              <Chip size="sm" variant="flat" color="primary">
                                Category: {commission.agent.category?.label || commission.agent.category?.name}
                              </Chip>
                            )}
                          </div>
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
                    <TableCell>
                      <div className="flex justify-center">
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Action Menu">
                            <DropdownItem
                              key="edit"
                              startContent={<Edit2 className="w-4 h-4" />}
                              onPress={() => handleEdit(commission)}
                            >
                              Edit
                            </DropdownItem>
                            <DropdownItem
                              key="status_pending"
                              onPress={() => handleStatusChange(commission.id, "PENDING")}
                              className={commission.status === "PENDING" ? "hidden" : ""}
                            >
                              Mark as Pending
                            </DropdownItem>
                            <DropdownItem
                              key="status_approved"
                              onPress={() => handleStatusChange(commission.id, "APPROVED")}
                              className={commission.status === "APPROVED" ? "hidden" : ""}
                            >
                              Mark as Approved
                            </DropdownItem>
                            <DropdownItem
                              key="status_paid"
                              onPress={() => handleStatusChange(commission.id, "PAID")}
                              className={commission.status === "PAID" ? "hidden" : ""}
                            >
                              Mark as Paid
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<Trash2 className="w-4 h-4" />}
                              onPress={() => handleDeleteClick(commission.id)}
                            >
                              Delete
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Commission Edit Modal */}
      <CommissionModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        editData={selectedCommission ? {
          id: selectedCommission.id,
          amount: selectedCommission.amount,
          currency: selectedCommission.currency,
          status: selectedCommission.status,
          remarks: selectedCommission.remarks,
          lead: selectedCommission.lead
        } : undefined}
        onSuccess={fetchCommissions}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>Delete Commission</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete this commission record? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose}>Cancel</Button>
            <Button color="danger" onPress={confirmDelete} isLoading={isDeleting}>Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PermissionGuard>
  );
}
