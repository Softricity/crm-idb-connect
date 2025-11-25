import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { TimelineEvent } from "@/lib/utils"; // optional if you use timeline logging

const supabase = createClient();

export interface OfflinePayment {
  id?: string;
  payment_mode?: string;
  currency: string;
  amount?: number;
  payment_type: string;
  reference_id?: string;
  receiver?: string; // partner id
  lead_id?: string;
  branch_id?: string; // Branch context for payment tracking
  created_at?: string;
  status?: string;
  file?: string;
  leads?: { name: string };
  partners?: { name: string; role?: string }; // optional: to ensure not agent
}

interface OfflinePaymentState {
  payments: OfflinePayment[];
  loading: boolean;
  fetchPaymentsByLeadId: (leadId: string) => Promise<void>;
  fetchPaymentsByReceiver: (receiverId: string) => Promise<void>;
  addPayment: (payment: Omit<OfflinePayment, "id" | "created_at" | "partners" | "leads">) => Promise<void>;
  updatePayment: (id: string, updates: Partial<OfflinePayment>) => Promise<void>;
  deletePayment: (id: string, fileUrl?: string) => Promise<void>;
  uploadPaymentFile: (file: File, leadId?: string) => Promise<string | null>;
  deletePaymentFile: (fileUrl: string) => Promise<void>;
  reset: () => void;
}

export const useOfflinePaymentStore = create<OfflinePaymentState>((set, get) => ({
  payments: [],
  loading: false,

  // Fetch all payments for a given lead
  fetchPaymentsByLeadId: async (leadId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("offline_payments")
      .select("*, leads(name), partners(name, role)")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payments:", error.message);
      throw error;
    } else set({ payments: data as OfflinePayment[] });
    set({ loading: false });
  },

  // Fetch payments by receiver (useful for partner dashboards)
  fetchPaymentsByReceiver: async (receiverId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("offline_payments")
      .select("*, leads(name), partners(name, role)")
      .eq("receiver", receiverId)
      .order("created_at", { ascending: false });

    if (error)
      console.error("Error fetching receiver payments:", error.message);
    else set({ payments: data as OfflinePayment[] });
    set({ loading: false });
  },

  // Add new offline payment (only if receiver is not an agent)
  addPayment: async (payment) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error("User not authenticated");

    // Verify receiver is not agent
    if (payment.receiver) {
      const { data: receiver, error: receiverError } = await supabase
        .from("partners")
        .select("id, role")
        .eq("id", payment.receiver)
        .single();

      if (receiverError) throw receiverError;
      // Agent check removed - will use separate agent table in future
    }

    const { data, error } = await supabase
      .from("offline_payments")
      .insert(payment)
      .select("*, leads(name), partners(name, role)")
      .single();

    if (error) throw error;

    set((state) => ({ payments: [data, ...state.payments] }));

    // Optional timeline logging
    await supabase.from("timeline").insert({
      lead_id: data.lead_id,
      event_type: TimelineEvent.OFFLINE_PAYMENT_ADDED,
      new_state: `${data.amount} ${data.currency}`,
      created_by: user.id,
    });
  },

  // Update existing payment record
  updatePayment: async (id, updates) => {
    const { data, error } = await supabase
      .from("offline_payments")
      .update(updates)
      .eq("id", id)
      .select("*, leads(name), partners(name, role)")
      .single();

    if (error) throw error;

    set((state) => ({
      payments: state.payments.map((p) => (p.id === id ? data : p)),
    }));
  },

  // Delete a payment
  deletePayment: async (id,fileUrl) => {
    const { data: oldData } = await supabase
      .from("offline_payments")
      .select("lead_id, amount, currency")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("offline_payments")
      .delete()
      .eq("id", id);

    if (error) throw error;

    set((state) => ({
      payments: state.payments.filter((p) => p.id !== id),
    }));

    const targetFile = fileUrl;
      if (targetFile) {
        await get().deletePaymentFile(targetFile);
      }

    // Optional timeline logging
    if (oldData) {
      await supabase.from("timeline").insert({
        lead_id: oldData.lead_id,
        event_type: TimelineEvent.OFFLINE_PAYMENT_DELETED,
        old_state: `${oldData.amount} ${oldData.currency}`,
      });
    }
  },
  uploadPaymentFile: async (file: File, leadId?: string) => {
    try {
      if (!file) return null;

      const date = new Date().toISOString();
      const safeName = file.name.replace(/\s+/g, "_");
      const path = `payments/${leadId || "unknown"}-${date}-${safeName}`;

      const { error } = await supabase.storage
        .from("idb-offline-payments")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
      if (error) throw error;

      const { data } = supabase.storage.from("idb-offline-payments").getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    }
  },
  deletePaymentFile: async (fileUrl) => {
    try {
      if (!fileUrl) return;

      // Extract path after bucket name
      const url = new URL(fileUrl);
      const pathname = url.pathname;
      const match = pathname.match(/idb-offline-payments\/(.*)$/);
      const filePath = match ? match[1] : null;

      if (!filePath) {
        console.warn("⚠️ Could not extract file path from URL:", fileUrl);
        return;
      }

      const { error } = await supabase.storage.from("idb-offline-payments").remove([filePath]);
      if (error) throw error;

      console.log("File deleted:", filePath);
    } catch (err) {
      console.error("Error deleting file from storage:", err);
    }
  },
  reset: () => set({ payments: [], loading: false }),
}));
