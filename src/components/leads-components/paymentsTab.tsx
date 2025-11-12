"use client";

import { useMemo, useEffect, useState } from "react";
import { useOfflinePaymentStore } from "@/stores/useOfflinePaymentStore";
import { usePartnerStore } from "@/stores/usePartnerStore";
import PaymentsTable from "./paymentsTable";
import CreateUpdatePayments from "./createUpdatePayments";
import PaymentToolbar from "./paymentTabToolbar";

export default function PaymentsTab({ leadId }: { leadId?: string }) {
  const { payments, fetchPaymentsByLeadId } = useOfflinePaymentStore() as any;
  const { loading, partners, fetchPartners } = usePartnerStore() as any;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    fetchPaymentsByLeadId?.(leadId || "");
  }, [fetchPaymentsByLeadId, leadId]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const receivers = useMemo(
    () =>
      (partners || [])
        .filter((p: any) => (p?.role || "").toLowerCase() !== "agent")
        .map((p: any) => ({ id: p.id, name: p.name })),
    [partners]
  );

  return (
    <div className="space-y-6">
      <PaymentToolbar
        disabled={loading || receivers.length === 0}
        onCreate={() => {
          setEditing(null);
          setOpen(true);
        }}
      />
      <PaymentsTable
        onEdit={(p) => {
          setEditing(p);
          setOpen(true);
        }}
      />
      <CreateUpdatePayments open={open} onClose={() => setOpen(false)} initial={editing} receivers={receivers} leadId={leadId||""}/>
    </div>
  );
}
