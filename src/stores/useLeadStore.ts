// store/lead.ts
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface Lead {
  id?: string;
  name: string;
  mobile: string;
  email: string;
  alternate_mobile?: string | null;
  type: string;
  city: string;
  purpose: string;
  preferred_country?: string | null;
  status: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  assigned_to?: string | null;
  created_at?: string;
  created_by?: string | null;
}

interface LeadState {
  leads: Lead[];
  loading: boolean;
  fetchLeads: () => Promise<void>;
  fetchLeadById: (id: string) => Promise<Lead | null>;
  addLead: (lead: Omit<Lead, "id" | "created_at">) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
}

export const useLeadStore = create<LeadState>((set) => ({
  leads: [],
  loading: false,

  fetchLeads: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from("leads").select("*");
    if (error) {
      console.error("Error fetching leads:", error.message);
    } else {
      set({ leads: data as Lead[] });
    }
    set({ loading: false });
  },

  fetchLeadById: async (id) => {
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
    if (error) {
      console.error("Error fetching lead by id:", error.message);
      return null;
    }
    return data as Lead;
  },

  addLead: async (lead) => {
    const sanitizedLead = Object.fromEntries(
      Object.entries(lead).map(([key, value]) => [key, value === "" ? null : value])
    );
    const { data, error } = await supabase.from("leads").insert([sanitizedLead]).select();
    if (error) {
      console.error("Error adding lead:", error.message);
      return;
    }
    set((state) => ({ leads: [...state.leads, ...(data as Lead[])] }));
  },

  updateLead: async (id, updates) => {
    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) {
      console.error("Error updating lead:", error.message);
      return;
    }
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === id ? { ...lead, ...(data?.[0] as Lead) } : lead
      ),
    }));
  },

  deleteLead: async (id) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      console.error("Error deleting lead:", error.message);
      return;
    }
    set((state) => ({
      leads: state.leads.filter((lead) => lead.id !== id),
    }));
  },
}));
