import { create } from "zustand";
import { useAuthStore } from "@/stores/useAuthStore";
import { TimelineEvent } from "@/lib/utils"; // optional if you use timeline logging
import { OfflinePaymentsAPI } from "@/lib/api";


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
        addPayment: (payment: Omit<OfflinePayment, "id" | "created_at" | "partners" | "leads">) => Promise<any>;
        updatePayment: (id: string, updates: Partial<OfflinePayment>) => Promise<any>;
        deletePayment: (id: string, fileUrl?: string) => Promise<any>;
        uploadPaymentFile: (file: File, leadId?: string) => Promise<string | null>;
        deletePaymentFile: (fileUrl: string) => Promise<void>;
        reset: () => void;
      }

      export const useOfflinePaymentStore = create<OfflinePaymentState>((set, get) => ({
        payments: [],
        loading: false,

        fetchPaymentsByLeadId: async (leadId: string) => {
          set({ loading: true });
          try {
            const data = await OfflinePaymentsAPI.fetchByLeadId(leadId);
            set({ payments: data || [] });
          } catch (err) {
            console.error("Error fetching payments:", err);
            throw err;
          } finally {
            set({ loading: false });
          }
        },

        fetchPaymentsByReceiver: async (receiverId: string) => {
          set({ loading: true });
          try {
            const data = await OfflinePaymentsAPI.fetchByReceiver(receiverId);
            set({ payments: data || [] });
          } catch (err) {
            console.error("Error fetching receiver payments:", err);
            throw err;
          } finally {
            set({ loading: false });
          }
        },

        addPayment: async (payment) => {
          const { user } = useAuthStore.getState();
          if (!user) throw new Error("User not authenticated");
          try {
            const data = await OfflinePaymentsAPI.createPayment(payment);
            set((state) => ({ payments: [data, ...state.payments] }));
            return data;
          } catch (err) {
            console.error('Error creating payment', err);
            throw err;
          }
        },

        updatePayment: async (id, updates) => {
          try {
            const data = await OfflinePaymentsAPI.updatePayment(id, updates);
            set((state) => ({ payments: state.payments.map((p) => (p.id === id ? data : p)) }));
            return data;
          } catch (err) {
            console.error('Error updating payment', err);
            throw err;
          }
        },

        deletePayment: async (id, fileUrl) => {
          try {
            const resp = await OfflinePaymentsAPI.deletePayment(id);
            set((state) => ({ payments: state.payments.filter((p) => p.id !== id) }));
            if (fileUrl) {
              await OfflinePaymentsAPI.deleteUploadedFile(fileUrl);
            }
            return resp;
          } catch (err) {
            console.error('Error deleting payment', err);
            throw err;
          }
        },

        uploadPaymentFile: async (file: File, leadId?: string) => {
          try {
            if (!file) return null;
            const res = await OfflinePaymentsAPI.uploadFile(file, leadId);
            return res?.url || null;
          } catch (err) {
            console.error('Upload failed:', err);
            return null;
          }
        },

        deletePaymentFile: async (fileUrl) => {
          try {
            if (!fileUrl) return;
            await OfflinePaymentsAPI.deleteUploadedFile(fileUrl);
          } catch (err) {
            console.error('Error deleting file via backend:', err);
          }
        },

        reset: () => set({ payments: [], loading: false }),
      }));
