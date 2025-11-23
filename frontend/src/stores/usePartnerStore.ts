// store/partner.ts
import { create } from "zustand";
import api from "@/lib/api";

export interface Partner {
  id?: string;
  role_id: string; // UUID of the role (changed from role name string to role_id UUID)
  role?: string; // Optional nested role object from backend
  name: string;
  email: string;
  mobile: string;
  password: string;
  address: string;
  city: string;
  state: string;
  area: string;
  zone: string;
  remarks?: string | null;
  branch_id?: string | null; // Branch assignment
  // Agent-specific fields
  agency_name?: string | null;

  created_at?: string;
}

interface PartnerState {
  partners: Partner[];
  loading: boolean;
  currentPartner?: Partner;
  fetchPartners: (branchId?: string) => Promise<void>;
  fetchPartnerById: (id: string) => Promise<Partner | null>;
  addPartner: (partner: Omit<Partner, "id" | "created_at">) => Promise<void>;
  updatePartner: (id: string, updates: Partial<Partner>) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  loadCurrentPartner: (id: string) => Promise<void>;
}

export const usePartnerStore = create<PartnerState>((set) => ({
  partners: [],
  loading: false,

  fetchPartners: async (branchId?: string) => {
    set({ loading: true });
    try {
      const data = await api.PartnersAPI.fetchPartners(branchId);
      set({ partners: data as Partner[] });
    } catch (error: any) {
      console.error("Error fetching partners:", error.message || error);
      throw error;
    }
    set({ loading: false });
  },

  fetchPartnerById: async (id) => {
    try {
      const data = await api.PartnersAPI.fetchPartnerById(id);
      return data as Partner;
    } catch (error) {
      console.error("Error fetching partner by id:", error);
      throw error;
    }
  },

  addPartner: async (partner) => {
    const sanitizedPartner = Object.fromEntries(
      Object.entries(partner).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );
    try {
      const newPartner = await api.PartnersAPI.createPartner(sanitizedPartner);
      set((state) => ({ partners: [...state.partners, newPartner] }));
    } catch (error) {
      console.error("Error adding partner:", error);
      throw error;
    }
  },

  updatePartner: async (id, updates) => {
    try {
      const updatedPartner = await api.PartnersAPI.updatePartner(id, updates);
      set((state) => ({
        partners: state.partners.map((partner) =>
          partner.id === id ? { ...partner, ...updatedPartner } : partner
        ),
      }));
    } catch (error) {
      console.error("Error updating partner:", error);
      throw error;
    }
  },

  deletePartner: async (id) => {
    try {
      await api.PartnersAPI.deletePartner(id);
      set((state) => ({
        partners: state.partners.filter((partner) => partner.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting partner:", error);
      throw error;
    }
  },

  loadCurrentPartner: async (id) => {
    try {
      const data = await api.PartnersAPI.fetchPartnerById(id);
      set({ currentPartner: data });
    } catch (error) {
      console.error("Failed to load partner:", error);
    }
  },
}));
