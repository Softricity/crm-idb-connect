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
import { UserCheck } from "lucide-react";

interface AssignCounsellorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
}

export function AssignCounsellorModal({ isOpen, onOpenChange, lead }: AssignCounsellorModalProps) {
  const { partners, fetchPartners } = usePartnerStore();
  const { updateLead, fetchLeads } = useLeadStore();
  const [selectedCounsellor, setSelectedCounsellor] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    if (lead?.assigned_to) {
      setSelectedCounsellor(lead.assigned_to);
    } else {
      setSelectedCounsellor("");
    }
  }, [lead]);

  // Get all internal team members (not external agents)
  const counsellors = partners.filter((p) => p.role?.toLowerCase() !== "agent");

  const handleAssign = async () => {
    if (!lead?.id) return;

    setIsAssigning(true);
    try {
      await updateLead(lead.id, { 
        assigned_to: selectedCounsellor || null 
      });
      
      const counsellorName = counsellors.find(c => c.id === selectedCounsellor)?.name || "Unassigned";
      toast.success(`Lead ${selectedCounsellor ? 'assigned to' : 'unassigned from'} ${counsellorName}`);
      
      await fetchLeads();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to assign counsellor");
      console.error("Error assigning counsellor:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const currentCounsellor = lead?.assigned_to 
    ? counsellors.find(c => c.id === lead.assigned_to)
    : null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>Assign Counsellor</span>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lead:</p>
                  <p className="text-base font-semibold">{lead?.name}</p>
                  <p className="text-sm text-gray-500">{lead?.email}</p>
                </div>

                {currentCounsellor && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      Currently assigned to: <span className="font-semibold">{currentCounsellor.name}</span>
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Counsellor</label>
                  <Select
                    placeholder="Select a counsellor"
                    selectedKeys={selectedCounsellor ? new Set([selectedCounsellor]) : new Set()}
                    onChange={(e) => setSelectedCounsellor(e.target.value)}
                    isDisabled={isAssigning}
                  >
                    <SelectItem key="">
                      Unassigned
                    </SelectItem>
                    {counsellors.map((counsellor) => (
                      <SelectItem key={counsellor.id!} >
                        {counsellor.name} - {counsellor.email}
                      </SelectItem>
                    )) as unknown as any}
                  </Select>
                </div>

                {counsellors.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      No counsellors available. Please create counsellor accounts first.
                    </p>
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
                onPress={handleAssign}
                isLoading={isAssigning}
                isDisabled={counsellors.length === 0}
              >
                {selectedCounsellor ? "Assign" : "Unassign"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
