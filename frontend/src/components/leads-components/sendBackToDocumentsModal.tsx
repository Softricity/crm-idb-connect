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
import { Undo2, Users } from "lucide-react";
import { usePartnerStore } from "@/stores/usePartnerStore";
import { useBranchStore } from "@/stores/useBranchStore";
import { useLeadStore, Lead } from "@/stores/useLeadStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { DepartmentsAPI, LeadsAPI } from "@/lib/api";
import { toast } from "sonner";

interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface SendBackToDocumentsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onForwarded?: () => void | Promise<void>;
}

export function SendBackToDocumentsModal({
  isOpen,
  onOpenChange,
  lead,
  onForwarded,
}: SendBackToDocumentsModalProps) {
  const { partners, fetchPartners } = usePartnerStore();
  const { selectedBranch } = useBranchStore();
  const { fetchLeadsBasedOnPermission } = useLeadStore();
  const { user } = useAuthStore();
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);

  // Resolve the Documents department dynamically
  const documentsDepartment = useMemo(
    () =>
      departments.find(
        (dept) => dept.code.toUpperCase() === "DOCUMENTS" && dept.is_active,
      ) || null,
    [departments],
  );

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
          console.error("Failed to fetch departments for send back:", error);
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

  // Only show users belonging to the Documents department
  const candidateUsers = useMemo(() => {
    if (!documentsDepartment) {
      return [];
    }

    return selectableUsers.filter((partner) =>
      (partner.partner_departments || []).some(
        (assignment) =>
          assignment.is_active &&
          assignment.department_id === documentsDepartment.id,
      ),
    );
  }, [documentsDepartment, selectableUsers]);

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

  const handleSendBack = async () => {
    if (!lead?.id || !documentsDepartment || !selectedAssignee) {
      return;
    }

    setIsSubmitting(true);
    try {
      await LeadsAPI.sendBackToDocuments(lead.id, selectedAssignee);

      const assigneeName =
        candidateUsers.find((partner) => partner.id === selectedAssignee)?.name ||
        "selected user";
      toast.success(`Sent back to Documents and assigned to ${assigneeName}.`);

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
        "Failed to send back to Documents";
      console.error("Error sending back to Documents:", message, error);
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
              <Undo2 className="h-5 w-5 text-warning" />
              <span>Send Back to Documents</span>
            </ModalHeader>

            <ModalBody>
              {!documentsDepartment ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  The Documents department is not configured or inactive. Contact an administrator.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Lead</p>
                    <p className="text-base font-semibold">{lead?.name}</p>
                    <p className="text-sm text-gray-500">{lead?.email}</p>
                  </div>

                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                    <p>
                      This will send the lead back to{" "}
                      <span className="font-semibold">{documentsDepartment.name}</span>.
                      Select a user from that department to reassign the lead.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Documents Department User</label>
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
                        No active staff found in the Documents department. Assign team members
                        to that department first.
                      </p>
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
                color="warning"
                onPress={handleSendBack}
                isLoading={isSubmitting}
                isDisabled={!documentsDepartment || !selectedAssignee || candidateUsers.length === 0}
              >
                Send Back to Documents
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
