// store/partner.ts
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface Partner {
  id?: string;
  role: "agent" | "counsellor";
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
  // Agent-specific fields
  agency_name?: string | null;
  // association_type?: string | null;
  // association_date?: string | null;
  // agreement_start_date?: string | null;
  // agreement_end_date?: string | null;

  created_at?: string;
}

interface PartnerState {
  partners: Partner[];
  loading: boolean;
  currentPartner?: Partner;
  fetchPartners: () => Promise<void>;
  fetchPartnerById: (id: string) => Promise<Partner | null>;
  addPartner: (partner: Omit<Partner, "id" | "created_at">) => Promise<void>;
  updatePartner: (id: string, updates: Partial<Partner>) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  loadCurrentPartner: (id: string) => Promise<void>;
}

export const usePartnerStore = create<PartnerState>((set) => ({
  partners: [],
  loading: false,

  fetchPartners: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from("partners").select("*");
    if (error) {
      console.error("Error fetching partners:", error.message);
      throw error;
    } else {
      set({ partners: data as Partner[] });
    }
    set({ loading: false });
  },

  fetchPartnerById: async (id) => {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Error fetching partner by id:", error.message);
      throw error;
    }
    return data as Partner;
  },

  addPartner: async (partner) => {
    const sanitizedPartner = Object.fromEntries(
      Object.entries(partner).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );
    const { data, error } = await supabase
      .from("partners")
      .insert([sanitizedPartner])
      .select();
    if (error) {
      console.error("Error adding partner:", error.message);
      throw error;
    }
    set((state) => ({ partners: [...state.partners, ...(data as Partner[])] }));
  },

  updatePartner: async (id, updates) => {
    const { data, error } = await supabase
      .from("partners")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) {
      console.error("Error updating partner:", error.message);
      throw error;
    }
    set((state) => ({
      partners: state.partners.map((partner) =>
        partner.id === id ? { ...partner, ...(data?.[0] as Partner) } : partner
      ),
    }));
  },

  deletePartner: async (id) => {
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) {
      console.error("Error deleting partner:", error.message);
      throw error;
    }
    set((state) => ({
      partners: state.partners.filter((partner) => partner.id !== id),
    }));
  },

  loadCurrentPartner: async (id) => {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Failed to load partner:", error.message);
      return;
    }

    set({ currentPartner: data });
  },
}));
