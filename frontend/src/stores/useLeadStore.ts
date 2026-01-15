import { create } from "zustand";
import api from "@/lib/api";
import { canViewAllLeads } from "@/lib/utils";

export interface Lead {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  type: string;
  preferred_country: string;
  preferred_course?: string | null;
  status: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  assigned_to?: string | null;
  created_at?: string;
  created_by?: string | null;
  agent_id?: string | null;
  reason?: string | null;
  password?: string | null;
  is_flagged?: boolean;
  branch_id?: string | null;
  partners_leads_assigned_toTopartners?: {
    name: string;
    email?: string;
  } | null;
}

interface LeadState {
  leads: Lead[];
  loading: boolean;
  fetchLeads: (branchId?: string) => Promise<void>;
  fetchLeadsBasedOnPermission: (userId: string, permissions: string[], branchId?: string) => Promise<void>;
  fetchLeadById: (id: string) => Promise<Lead | null>;
  getAgentLeads: (agentId: string, branchId?: string) => Promise<void>;
  getCounsellorLeads: (counsellorId: string, branchId?: string) => Promise<void>;
  addLead: (lead: Omit<Lead, "id" | "created_at">) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  getLeadIds: () => string[];
  reset: () => void;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  loading: false,

  fetchLeads: async (branchId) => {
    set({ loading: true });
    try {
      const data = await api.LeadsAPI.fetchLeads(branchId);
      set({ leads: data as Lead[] });
    } catch (error: any) {
      console.error("Error fetching leads:", error.message || error);
    }
    set({ loading: false });
  },

  fetchLeadsBasedOnPermission: async (userId: string, permissions: string[], branchId?: string) => {
    set({ loading: true });
    try {
      // If user has LEAD_VIEW permission, fetch all leads
      if (canViewAllLeads(permissions)) {
        const data = await api.LeadsAPI.fetchLeads(branchId);
        set({ leads: data as Lead[] });
      } else {
        // Otherwise, fetch only leads assigned to this user
        console.log("User is restricted to their own leads.");
        const data = await api.LeadsAPI.getCounsellorLeads(userId, branchId);
        set({ leads: data as Lead[] });
      }
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

  getAgentLeads: async (agentId: string, branchId?: string) => {
    set({ loading: true });
    try {
      const data = await api.LeadsAPI.getAgentLeads(agentId, branchId);
      set({ leads: data as Lead[] });
    } catch (error) {
      console.error("Error fetching agent leads:", error);
      throw error;
    }
    set({ loading: false });
  },

  getCounsellorLeads: async (counsellorId: string, branchId?: string) => {
    set({ loading: true });
    try {
      const data = await api.LeadsAPI.getCounsellorLeads(counsellorId, branchId);
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

  reset: () => set({ leads: [], loading: false }),
}));
