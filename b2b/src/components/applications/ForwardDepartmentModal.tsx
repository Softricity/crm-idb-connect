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
import { LeadsAPI, PartnersAPI, DepartmentsAPI } from "@/lib/api";
import type { Lead } from "./ApplicationsTable";

type PartnerCandidate = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  partner_departments?: Array<{ department_id: string; is_active: boolean }>;
};

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
  department_orders?: DepartmentOrderConfig | null;
}

function getCurrentUserBranchId(): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  const userCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("b2b-auth-user=") || cookie.startsWith("auth-user="));

  if (!userCookie) {
    return undefined;
  }

  const encoded = userCookie.split("=")[1];
  if (!encoded) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(encoded));
    return parsed?.branch_id;
  } catch {
    return undefined;
  }
}

interface ForwardDepartmentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onForwarded?: () => void | Promise<void>;
}

export function ForwardDepartmentModal({ isOpen, onOpenChange, lead, onForwarded }: ForwardDepartmentModalProps) {
  const [partners, setPartners] = useState<PartnerCandidate[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Departments sorted by DB-configured order_index — no hardcoded flow array.
  const sortedActiveDepartments = useMemo(
    () =>
      departments
        .filter((d) => d.is_active && (d.department_orders?.is_active ?? true))
        .sort(
          (a, b) =>
            (a.department_orders?.order_index ?? Number.MAX_SAFE_INTEGER) -
            (b.department_orders?.order_index ?? Number.MAX_SAFE_INTEGER),
        ),
    [departments],
  );

  const currentDepartmentIndex = useMemo(
    () => sortedActiveDepartments.findIndex((d) => d.id === lead?.current_department_id),
    [sortedActiveDepartments, lead?.current_department_id],
  );

  const currentDepartment = useMemo(
    () => (currentDepartmentIndex >= 0 ? sortedActiveDepartments[currentDepartmentIndex] : null),
    [sortedActiveDepartments, currentDepartmentIndex],
  );

  const nextDepartment = useMemo(
    () =>
      currentDepartmentIndex >= 0
        ? sortedActiveDepartments[currentDepartmentIndex + 1] || null
        : null,
    [sortedActiveDepartments, currentDepartmentIndex],
  );

  useEffect(() => {
    if (!isOpen) return;

    setSelectedAssignee("");

    const branchId = getCurrentUserBranchId();

    Promise.all([
      PartnersAPI.fetchPartners(branchId).catch(() => []),
      DepartmentsAPI.fetchDepartments(false).catch(() => []),
    ]).then(([partnersData, departmentsData]) => {
      setPartners(Array.isArray(partnersData) ? partnersData : []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
    });
  }, [isOpen]);

  const internalUsers = useMemo(
    () => partners.filter((partner) => (partner.role || "").toLowerCase() !== "agent"),
    [partners],
  );

  const selectableUsers = useMemo(
    () => internalUsers.filter((p) => typeof p.id === "string" && p.id.trim().length > 0),
    [internalUsers],
  );

  // Filter candidate users to those assigned to the next department.
  // Falls back to all internal users if department assignment data is unavailable.
  const candidateUsers = useMemo(() => {
    if (!nextDepartment) return [];
    const inDept = selectableUsers.filter((p) =>
      (p.partner_departments || []).some(
        (a) => a.is_active && a.department_id === nextDepartment.id,
      ),
    );
    return inDept.length > 0 ? inDept : selectableUsers;
  }, [nextDepartment, selectableUsers]);

  const selectedAssigneeLabel = useMemo(() => {
    if (!selectedAssignee) return "";
    const selected = candidateUsers.find((p) => p.id === selectedAssignee);
    if (!selected) return "";
    return `${selected.name || "Unnamed"} - ${selected.email || "No email"}`;
  }, [candidateUsers, selectedAssignee]);

  const currentLabel = currentDepartment?.name || "Current";
  const nextLabel = nextDepartment?.name || null;

  const handleForward = async () => {
    if (!lead?.id || !nextDepartment || !selectedAssignee) return;

    setIsSubmitting(true);
    try {
      // Trigger via forward_to_next_department flag — backend resolves next
      // department dynamically from department_order.order_index in the DB.
      // No hardcoded type strings (lead/application/visa) are used anywhere.
      await LeadsAPI.update(lead.id, {
        forward_to_next_department: true,
        assigned_to: selectedAssignee,
      });

      if (onForwarded) {
        await onForwarded();
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error forwarding lead:", error);
      alert(error?.message || "Failed to forward lead");
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
                      Forwarding from <span className="font-semibold">{currentLabel}</span> to{" "}
                      <span className="font-semibold">{nextLabel}</span>.
                    </p>
                    <p className="mt-1">Select a user from the next department to complete this action.</p>
                  </div>

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
                      renderValue={() =>
                        selectedAssigneeLabel ? (
                          <span className="text-gray-900">{selectedAssigneeLabel}</span>
                        ) : (
                          <span className="text-gray-500">Select a user</span>
                        )
                      }
                      classNames={{
                        trigger: "bg-white text-gray-900",
                        value: "text-gray-900 opacity-100",
                        selectorIcon: "text-gray-600",
                        popoverContent: "bg-white",
                        listbox: "text-gray-900",
                      }}
                    >
                      {candidateUsers.map((partner) => (
                        <SelectItem
                          key={partner.id || ""}
                          textValue={`${partner.name || "Unnamed"} - ${partner.email || "No email"}`}
                          className="text-gray-900"
                        >
                          {partner.name || "Unnamed"} - {partner.email || "No email"}
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
                      <p>No eligible users were found for the next department in this branch.</p>
                    </div>
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
                isDisabled={!nextDepartment || !selectedAssignee || candidateUsers.length === 0}
              >
                Confirm Forward
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
