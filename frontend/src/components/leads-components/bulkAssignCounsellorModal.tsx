"use client";

import React, { useEffect, useState } from "react";
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
import { usePartnerStore } from "@/stores/usePartnerStore";
import { useLeadStore, Lead } from "@/stores/useLeadStore";
import { toast } from "sonner";
import { Users, UserCheck } from "lucide-react";

interface BulkAssignCounsellorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeadIds: string[];
  allLeads: Lead[];
  onComplete: () => void;
}

export function BulkAssignCounsellorModal({ 
  isOpen, 
  onOpenChange, 
  selectedLeadIds, 
  allLeads,
  onComplete 
}: BulkAssignCounsellorModalProps) {
  const { partners, fetchPartners } = usePartnerStore();
  const { updateLead, fetchLeads } = useLeadStore();
  const [selectedCounsellor, setSelectedCounsellor] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Get all internal team members (not external agents)
  const counsellors = partners.filter((p) => p.role?.toLowerCase() !== "agent");
  const selectedLeads = allLeads.filter(lead => selectedLeadIds.includes(lead.id || ""));

  const handleBulkAssign = async () => {
    if (selectedLeads.length === 0) {
      toast.error("No leads selected");
      return;
    }

    setIsAssigning(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Assign leads one by one
      for (const lead of selectedLeads) {
        if (lead.id) {
          try {
            await updateLead(lead.id, { 
              assigned_to: selectedCounsellor || null 
            });
            successCount++;
          } catch (error) {
            failCount++;
            console.error(`Failed to assign lead ${lead.id}:`, error);
          }
        }
      }

      const counsellorName = counsellors.find(c => c.id === selectedCounsellor)?.name || "Unassigned";
      
      if (successCount > 0) {
        toast.success(`${successCount} lead${successCount > 1 ? 's' : ''} ${selectedCounsellor ? 'assigned to' : 'unassigned from'} ${counsellorName}`);
      }
      
      if (failCount > 0) {
        toast.error(`Failed to assign ${failCount} lead${failCount > 1 ? 's' : ''}`);
      }
      
      await fetchLeads();
      onComplete();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to assign counsellors");
      console.error("Error in bulk assignment:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Bulk Assign Counsellor</span>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    You are about to assign <span className="font-semibold">{selectedLeads.length}</span> lead
                    {selectedLeads.length !== 1 ? 's' : ''} to a counsellor.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Counsellor</label>
                  <Select
                    placeholder="Select a counsellor"
                    selectedKeys={selectedCounsellor ? new Set([selectedCounsellor]) : new Set()}
                    onChange={(e) => setSelectedCounsellor(e.target.value)}
                    isDisabled={isAssigning}
                  >
                    <>
                      <SelectItem key="">
                        Unassign All
                      </SelectItem>
                      {counsellors.map((counsellor) => (
                        <SelectItem key={counsellor.id!}>
                          {counsellor.name} - {counsellor.email}
                        </SelectItem>
                      ))}
                    </>
                  </Select>
                </div>

                {counsellors.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      No counsellors available. Please create counsellor accounts first.
                    </p>
                  </div>
                )}

                {selectedLeads.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Selected Leads:</p>
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
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={isAssigning}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleBulkAssign}
                isLoading={isAssigning}
                isDisabled={counsellors.length === 0 || selectedLeads.length === 0}
              >
                {selectedCounsellor ? `Assign to ${counsellors.find(c => c.id === selectedCounsellor)?.name}` : "Unassign All"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
