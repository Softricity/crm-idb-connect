"use client";

import { useMemo, useEffect, useState } from "react";
import { useOfflinePaymentStore } from "@/stores/useOfflinePaymentStore";
import { usePartnerStore } from "@/stores/usePartnerStore";
import PaymentsTable from "./paymentsTable";
import CreateUpdatePayments from "./createUpdatePayments";
import PaymentToolbar from "./paymentTabToolbar";
import { useBranchStore } from "@/stores/useBranchStore";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Button as HeroButton } from "@heroui/react";
import { Copy, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function PaymentsTab({ leadId }: { leadId?: string }) {
  const { payments, fetchPaymentsByLeadId } = useOfflinePaymentStore() as any;
  const { loading, partners, fetchPartners } = usePartnerStore() as any;
  const { selectedBranch } = useBranchStore();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"record" | "schedule">("record");
  const [editing, setEditing] = useState<any | null>(null);
  const { isOpen: isLinkModalOpen, onOpen: onLinkModalOpen, onOpenChange: onLinkModalOpenChange } = useDisclosure();

  useEffect(() => {
    fetchPaymentsByLeadId?.(leadId || "");
  }, [fetchPaymentsByLeadId, leadId]);

  useEffect(() => {
    fetchPartners(selectedBranch?.id);
  }, [fetchPartners, selectedBranch?.id]);

  const receivers = useMemo(
    () =>
      (partners || [])
        .filter((p: any) => (p?.role || "").toLowerCase() !== "agent")
        .map((p: any) => ({ id: p.id, name: p.name })),
    [partners]
  );

  const paymentLink = `https://idbconnect.global/pay/${leadId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <PaymentToolbar
        disabled={loading || receivers.length === 0}
        onCreate={() => {
          setEditing(null);
          setMode("record");
          setOpen(true);
        }}
        onGenerateLink={onLinkModalOpen}
        onSchedule={() => {
          setEditing(null);
          setMode("schedule");
          setOpen(true);
        }}
      />
      <PaymentsTable
        onEdit={(p) => {
          setEditing(p);
          setMode(p.status === "SCHEDULED" ? "schedule" : "record");
          setOpen(true);
        }}
      />
      <CreateUpdatePayments open={open} onClose={() => setOpen(false)} initial={editing} receivers={receivers} leadId={leadId||""} mode={mode}/>

      <Modal isOpen={isLinkModalOpen} onOpenChange={onLinkModalOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Generate Payment Link</ModalHeader>
              <ModalBody>
                <p className="text-sm text-gray-500 mb-4">
                  Share this link with the lead to receive online payments.
                </p>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={paymentLink} 
                    startContent={<LinkIcon className="h-4 w-4 text-gray-400" />}
                    variant="bordered"
                  />
                  <HeroButton isIconOnly color="primary" variant="flat" onPress={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </HeroButton>
                </div>
              </ModalBody>
              <ModalFooter>
                <HeroButton color="danger" variant="light" onPress={onClose}>
                  Close
                </HeroButton>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
