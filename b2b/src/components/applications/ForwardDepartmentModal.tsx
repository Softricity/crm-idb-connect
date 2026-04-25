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
import { LeadsAPI, PartnersAPI } from "@/lib/api";
import type { Lead } from "./ApplicationsTable";

type PipelineType = "lead" | "application" | "visa";

type PartnerCandidate = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

const FLOW: PipelineType[] = ["lead", "application", "visa"];

const DEPARTMENT_LABELS: Record<PipelineType, string> = {
  lead: "Counselling",
  application: "Admissions",
  visa: "Visa",
};

const ROLE_HINTS: Record<PipelineType, string[]> = {
  lead: ["counsellor", "counselor"],
  application: ["admission", "application"],
  visa: ["visa", "immigration"],
};

function normalizeType(type?: string | null): PipelineType | null {
  const value = (type || "").toLowerCase();
  if (!value) {
    return "lead";
  }
  if (value === "lead" || value === "application" || value === "visa") {
    return value;
  }
  return null;
}

function getNextType(currentType?: string | null): PipelineType | null {
  const normalized = normalizeType(currentType);
  if (!normalized) {
    return null;
  }

  const index = FLOW.indexOf(normalized);
  if (index < 0 || index >= FLOW.length - 1) {
    return null;
  }

  return FLOW[index + 1];
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
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentType = useMemo(() => normalizeType(lead?.type), [lead?.type]);
  const nextType = useMemo(() => getNextType(lead?.type), [lead?.type]);

  useEffect(() => {
    const loadPartners = async () => {
      if (!isOpen) {
        return;
      }

      setSelectedAssignee("");

      try {
        const branchId = getCurrentUserBranchId();
        const data = await PartnersAPI.fetchPartners(branchId);
        setPartners(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load partners for forward flow:", error);
        setPartners([]);
      }
    };

    loadPartners();
  }, [isOpen]);

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
    if (!nextType) {
      return [];
    }

    const hints = ROLE_HINTS[nextType];
    const hinted = selectableUsers.filter((partner) => {
      const role = (partner.role || "").toLowerCase();
      return hints.some((hint) => role.includes(hint));
    });

    return hinted.length > 0 ? hinted : selectableUsers;
  }, [nextType, selectableUsers]);

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

  const currentLabel = currentType ? DEPARTMENT_LABELS[currentType] : "Current";
  const nextLabel = nextType ? DEPARTMENT_LABELS[nextType] : null;

  const handleForward = async () => {
    if (!lead?.id || !nextType || !selectedAssignee) {
      return;
    }

    setIsSubmitting(true);
    try {
      await LeadsAPI.update(lead.id, {
        type: nextType,
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
              {!nextType ? (
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
                        <SelectItem key={partner.id || ""} textValue={`${partner.name || "Unnamed"} - ${partner.email || "No email"}`} className="text-gray-900">
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
                isDisabled={!nextType || !selectedAssignee || candidateUsers.length === 0}
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
