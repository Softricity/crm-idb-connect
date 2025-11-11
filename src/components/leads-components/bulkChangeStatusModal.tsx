"use client";

import React, { useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Textarea,
  Progress,
} from "@heroui/react";
import { useLeadStore, Lead } from "@/stores/useLeadStore";
import { toast } from "sonner";
import { Shuffle, AlertCircle } from "lucide-react";

interface BulkChangeStatusModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeadIds: string[];
  allLeads: Lead[];
  onComplete: () => void; // e.g., clear selected + refresh views
}

// Keep values aligned to your backend/store expected strings
const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "inprocess", label: "In Process" },
  { value: "assigned", label: "Assigned" },
  { value: "cold", label: "Cold" },
  { value: "rejected", label: "Rejected" },
  // If you also use these internally:
  { value: "interested", label: "Interested" },
  { value: "contacted", label: "Contacted" },
  { value: "hot", label: "Hot" },
  { value: "engaged", label: "Engaged" },
];

export default function BulkChangeStatusModal({
  isOpen,
  onOpenChange,
  selectedLeadIds,
  allLeads,
  onComplete,
}: BulkChangeStatusModalProps) {
  const { updateLead, fetchLeads } = useLeadStore();

  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const selectedLeads = useMemo(
    () => allLeads.filter((l) => selectedLeadIds.includes(l.id || "")),
    [allLeads, selectedLeadIds]
  );

  const total = selectedLeads.length;
  const progress = total > 0 ? Math.round((currentIndex / total) * 100) : 0;

  const canSubmit =
    !!selectedStatus && reason.trim().length > 0 && selectedLeads.length > 0;

  const handleConfirm = async () => {
    if (!canSubmit) {
      toast.error("Please select a status and enter a reason.");
      return;
    }
    setIsProcessing(true);
    setCurrentIndex(0);

    let success = 0;
    let fail = 0;

    try {
      for (let i = 0; i < selectedLeads.length; i++) {
        const lead = selectedLeads[i];
        try {
          if (lead.id) {
            await updateLead(lead.id, {
              status: selectedStatus,
              reason: reason.trim(),
            });
            success++;
          }
        } catch (err) {
          fail++;
          console.error("Failed to update lead", lead.id, err);
        } finally {
          setCurrentIndex(i + 1);
        }
      }

      if (success) {
        toast.success(
          `Updated ${success} lead${success > 1 ? "s" : ""} to "${STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label ?? selectedStatus
          }".`
        );
      }
      if (fail) {
        toast.error(`Failed to update ${fail} lead${fail > 1 ? "s" : ""}.`);
      }

      await fetchLeads();
      onComplete(); // e.g., clear selection
      onOpenChange(false);
    } catch (err) {
      toast.error("Bulk status update failed.");
      console.error(err);
    } finally {
      setIsProcessing(false);
      setCurrentIndex(0);
    }
  };

  const handleClose = (open: boolean) => {
    if (isProcessing) return; // lock modal during processing
    onOpenChange(open);
    if (!open) {
      // reset local state when closing
      setSelectedStatus("");
      setReason("");
      setCurrentIndex(0);
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleClose}
      size="md"
      // lock: no click outside, no ESC while processing
      isDismissable={!isProcessing}
      isKeyboardDismissDisabled={isProcessing}
      hideCloseButton={isProcessing}
      classNames={{
        base: "max-w-xl",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-primary" />
              <span>Bulk Change Lead Status</span>
            </ModalHeader>

            <ModalBody>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    You are about to update the status of{" "}
                    <span className="font-semibold">{selectedLeads.length}</span>{" "}
                    lead{selectedLeads.length !== 1 ? "s" : ""}.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Status</label>
                    <Select
                      placeholder="Choose a new status"
                      selectedKeys={
                        selectedStatus ? new Set([selectedStatus]) : new Set()
                      }
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      isDisabled={isProcessing}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Reason</label>
                      <span className="text-xs text-gray-500">
                        (required)
                      </span>
                    </div>
                    <Textarea
                      placeholder="Write the reason for this status change..."
                      minRows={3}
                      value={reason}
                      onValueChange={setReason}
                      isDisabled={isProcessing}
                    />
                  </div>
                </div>

                {selectedLeads.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      Selected Leads:
                    </p>
                    <ul className="space-y-1">
                      {selectedLeads.slice(0, 10).map((lead) => (
                        <li key={lead.id} className="text-sm text-gray-700">
                          • {lead.name} ({lead.email})
                        </li>
                      ))}
                      {selectedLeads.length > 10 && (
                        <li className="text-sm text-gray-500 italic">
                          ... and {selectedLeads.length - 10} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Progress while processing */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Updating leads…</span>
                      <span>
                        {currentIndex}/{total}
                      </span>
                    </div>
                    <Progress
                      aria-label="progress"
                      value={progress}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Inline validation hint */}
                {!isProcessing && !canSubmit && selectedLeads.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      Select a status and enter a reason to continue.
                    </span>
                  </div>
                )}
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="light"
                onPress={() => handleClose(false)}
                isDisabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleConfirm}
                isDisabled={!canSubmit || isProcessing}
                isLoading={isProcessing}
              >
                Change Status
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
