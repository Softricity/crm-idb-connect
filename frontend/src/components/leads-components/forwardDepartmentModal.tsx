"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
} from "@heroui/react";
import { Repeat, Users } from "lucide-react";
import { usePartnerStore } from "@/stores/usePartnerStore";
import { useBranchStore } from "@/stores/useBranchStore";
import { useLeadStore, Lead } from "@/stores/useLeadStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { DepartmentsAPI } from "@/lib/api";
import { toast } from "sonner";

interface DepartmentOrderConfig {
  order_index: number;
  is_active: boolean;
  is_default: boolean;
}

interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  forward_no_assign?: boolean;
  department_orders?: DepartmentOrderConfig | null;
}

interface ForwardDepartmentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onForwarded?: () => void | Promise<void>;
}

export function ForwardDepartmentModal({
  isOpen,
  onOpenChange,
  lead,
  onForwarded,
}: ForwardDepartmentModalProps) {
  const { partners, fetchPartners } = usePartnerStore();
  const { selectedBranch } = useBranchStore();
  const { updateLead, fetchLeadsBasedOnPermission } = useLeadStore();
  const { user } = useAuthStore();
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);

  // Departments sorted by their DB-configured order_index — no hardcoded type progression.
  const sortedActiveDepartments = useMemo(
    () =>
      departments
        .filter(
          (department) =>
            department.is_active &&
            (department.department_orders?.is_active ?? true),
        )
        .sort(
          (a, b) =>
            (a.department_orders?.order_index ?? Number.MAX_SAFE_INTEGER) -
            (b.department_orders?.order_index ?? Number.MAX_SAFE_INTEGER),
        ),
    [departments],
  );

  const currentDepartmentIndex = useMemo(
    () =>
      sortedActiveDepartments.findIndex(
        (department) => department.id === lead?.current_department_id,
      ),
    [sortedActiveDepartments, lead?.current_department_id],
  );

  const currentDepartment = useMemo(
    () =>
      currentDepartmentIndex >= 0
        ? sortedActiveDepartments[currentDepartmentIndex]
        : null,
    [sortedActiveDepartments, currentDepartmentIndex],
  );

  const nextDepartment = useMemo(
    () =>
      currentDepartmentIndex >= 0
        ? sortedActiveDepartments[currentDepartmentIndex + 1] || null
        : null,
    [sortedActiveDepartments, currentDepartmentIndex],
  );

  const isForwardNoAssign = nextDepartment?.forward_no_assign === true;

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetchPartners(selectedBranch?.id),
        DepartmentsAPI.fetchDepartments(false),
      ])
        .then(([, departmentsResponse]) => {
          setDepartments(
            Array.isArray(departmentsResponse)
              ? (departmentsResponse as DepartmentRecord[])
              : [],
          );
        })
        .catch((error) => {
          console.error("Failed to fetch departments for forwarding:", error);
          setDepartments([]);
        });
      setSelectedAssignee("");
    }
  }, [isOpen, fetchPartners, selectedBranch?.id]);

  const internalUsers = useMemo(
    () => partners.filter((partner) => (partner.role || "").toLowerCase() !== "agent"),
    [partners],
  );

  const selectableUsers = useMemo(
    () =>
      internalUsers.filter(
        (partner) => typeof partner.id === "string" && partner.id.trim().length > 0,
      ),
    [internalUsers],
  );

  const candidateUsers = useMemo(() => {
    if (!nextDepartment) {
      return [];
    }

    return selectableUsers.filter((partner) =>
      (partner.partner_departments || []).some(
        (assignment) =>
          assignment.is_active &&
          assignment.department_id === nextDepartment.id,
      ),
    );
  }, [nextDepartment, selectableUsers]);

  const selectedAssigneeLabel = useMemo(() => {
    if (!selectedAssignee) {
      return "";
    }

    const selected = candidateUsers.find((partner) => partner.id === selectedAssignee);
    if (!selected) {
      return "";
    }

    return `${selected.name || "Unnamed"} - ${selected.email || "No email"}`;
  }, [candidateUsers, selectedAssignee]);

  const currentLabel = currentDepartment?.name || "Current";
  const nextLabel = nextDepartment?.name || null;

  const handleForward = async () => {
    if (!lead?.id || !nextDepartment) {
      return;
    }

    // For forward_no_assign departments (e.g. VISA), assignee is optional
    if (!isForwardNoAssign && !selectedAssignee) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Send forward_to_next_department: true — the backend resolves the next
      // department dynamically from department_order.order_index in the DB.
      // No hardcoded type strings (lead/application/visa) are used anywhere.
      const updatePayload: Record<string, unknown> = {
        forward_to_next_department: true,
      };
      if (selectedAssignee) {
        updatePayload.assigned_to = selectedAssignee;
      }

      await updateLead(lead.id, updatePayload);

      if (selectedAssignee) {
        const assigneeName =
          candidateUsers.find((partner) => partner.id === selectedAssignee)?.name ||
          "selected user";
        toast.success(`Forwarded to ${nextLabel} and assigned to ${assigneeName}.`);
      } else {
        toast.success(`Forwarded to ${nextLabel}.`);
      }

      if (user?.id && user.permissions) {
        await fetchLeadsBasedOnPermission(user.id, user.permissions, selectedBranch?.id);
      }

      if (onForwarded) {
        await onForwarded();
      }

      onOpenChange(false);
    } catch (error: any) {
      const message =
        error?.body?.message ||
        error?.body?.error ||
        error?.message ||
        "Failed to forward lead";
      console.error("Error forwarding lead:", message, error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-primary" />
              <span>Forward To Next Department</span>
            </ModalHeader>

            <ModalBody>
              {!nextDepartment ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  This lead is already in the final department. No forward action is available.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Lead</p>
                    <p className="text-base font-semibold">{lead?.name}</p>
                    <p className="text-sm text-gray-500">{lead?.email}</p>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    <p>
                      Forwarding from{" "}
                      <span className="font-semibold">{currentLabel}</span> to{" "}
                      <span className="font-semibold">{nextLabel}</span>.
                    </p>
                    <p className="mt-1">
                      {isForwardNoAssign
                        ? "This department does not require reassignment. The current owner will be preserved."
                        : "Select a user from the next department to complete this action."}
                    </p>
                  </div>

                  {!isForwardNoAssign && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Next Department User</label>
                        <Select
                          placeholder="Select a user"
                          selectedKeys={selectedAssignee ? new Set([selectedAssignee]) : new Set()}
                          onSelectionChange={(keys) => {
                            const value = Array.from(keys)[0] as string | undefined;
                            setSelectedAssignee(value ?? "");
                          }}
                          isDisabled={isSubmitting || candidateUsers.length === 0}
                        >
                          {candidateUsers.map((partner) => (
                            <SelectItem
                              key={partner.id!}
                              textValue={`${partner.name || "Unnamed"} - ${partner.email || "No email"}`}
                            >
                              {partner.name} - {partner.email}
                            </SelectItem>
                          )) as unknown as any}
                        </Select>
                      </div>

                      {candidateUsers.length === 0 && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                          <div className="mb-1 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="font-semibold">No users available</span>
                          </div>
                          <p>
                            No active staff found in the next department. Assign team members to
                            that department first.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleForward}
                isLoading={isSubmitting}
                isDisabled={!nextDepartment || (!isForwardNoAssign && (!selectedAssignee || candidateUsers.length === 0))}
              >
                {isForwardNoAssign ? "Forward (Keep Assignee)" : "Confirm Forward"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
