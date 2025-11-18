import { create } from "zustand";
import api from "@/lib/api";

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
  partners_leads_assigned_toTopartners?: {
    name: string;
    email?: string;
  } | null;
  created_at?: string;
  created_by?: string | null;
  reason?: string | null;
  is_flagged?: boolean;
}

interface LeadState {
  leads: Lead[];
  applications: Lead[];
  loading: boolean;
  fetchLeads: () => Promise<void>;
  fetchApplications: () => Promise<void>;
  fetchLeadById: (id: string) => Promise<Lead | null>;
  getAgentLeads: (agentId: string) => Promise<void>;
  getCounsellorLeads: (counsellorId: string) => Promise<void>;
  addLead: (lead: Omit<Lead, "id" | "created_at">) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  getLeadIds: () => string[];
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  applications: [],
  loading: false,

  fetchLeads: async () => {
    set({ loading: true });
    try {
      const data = await api.LeadsAPI.fetchLeads();
      set({ leads: data as Lead[] });
    } catch (error: any) {
      console.error("Error fetching leads:", error.message || error);
    }
    set({ loading: false });
  },

  fetchApplications: async () => {
    set({ loading: true });
    try {
      const data = await api.LeadsAPI.fetchApplications();
      set({ applications: data as Lead[] });
    } catch (error: any) {
      console.error("Error fetching leads:", error.message || error);
    }
    set({ loading: false });
  },

  fetchLeadById: async (id) => {
    try {
      const data = await api.LeadsAPI.fetchLeadById(id);
      return data as Lead;
    } catch (error) {
      console.error("Error fetching lead by id:", error);
      throw error;
    }
  },

  getAgentLeads: async (agentId: string) => {
    set({ loading: true });
    try {
      const data = await api.LeadsAPI.getAgentLeads(agentId);
      set({ leads: data as Lead[] });
    } catch (error) {
      console.error("Error fetching agent leads:", error);
      throw error;
    }
    set({ loading: false });
  },

  getCounsellorLeads: async (counsellorId: string) => {
    set({ loading: true });
    try {
      const data = await api.LeadsAPI.getCounsellorLeads(counsellorId);
      set({ leads: data as Lead[] });
    } catch (error) {
      console.error("Error fetching counsellor leads:", error);
      throw error;
    }
    set({ loading: false });
  },

  addLead: async (lead) => {
    try {
      const newLead = await api.LeadsAPI.createLead(lead);
      set((state) => ({ leads: [...state.leads, newLead] }));
      // timeline logging will be handled by the backend
    } catch (err) {
      console.error("Error adding lead:", err);
      throw err;
    }
  },

  getLeadIds: () => {
    const state = get();
    return state.leads.map((lead) => lead.id!).filter(Boolean);
  },

  updateLead: async (id, updates) => {
    try {
      // Backend API handles both the update and timeline logging
      const updatedLead = await api.LeadsAPI.updateLead(id, updates);
      
      // Update the local Zustand state
      set((state) => ({
        leads: state.leads.map((lead) =>
          lead.id === id ? { ...lead, ...updatedLead } : lead
        ),
      }));
    } catch (error) {
      console.error("Error updating lead:", error);
      throw error;
    }
  },
}));
