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
  exam_taken?: string | null;
  exam_score?: string | null;
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
  current_department_id?: string | null;
  can_forward_to_next_department?: boolean;
  partners_leads_assigned_toTopartners?: {
    name: string;
    email?: string;
  } | null;
}

interface LeadState {
  leads: Lead[];
  loading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    counts: Record<string, number>;
  };
  fetchLeads: (branchId?: string, page?: number, limit?: number) => Promise<void>;
  fetchLeadsBasedOnPermission: (userId: string, permissions: string[], branchId?: string, role?: string, page?: number, limit?: number) => Promise<void>;
  fetchLeadById: (id: string) => Promise<Lead | null>;
  getAgentLeads: (agentId: string, branchId?: string, page?: number, limit?: number) => Promise<void>;
  getCounsellorLeads: (counsellorId: string, branchId?: string, page?: number, limit?: number) => Promise<void>;
  addLead: (lead: Omit<Lead, "id" | "created_at">) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  getLeadIds: () => string[];
  reset: () => void;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  loading: false,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    counts: {},
  },

  fetchLeads: async (branchId, page = 1, limit = 10) => {
    set({ loading: true });
    try {
      const response = await api.LeadsAPI.fetchLeads(branchId, page, limit);
      set({ 
        leads: response.data as Lead[],
        pagination: response.meta
      });
    } catch (error: any) {
      console.error("Error fetching leads:", error.message || error);
    }
    set({ loading: false });
  },

  fetchLeadsBasedOnPermission: async (userId: string, permissions: string[], branchId?: string, role?: string, page = 1, limit = 10) => {
    set({ loading: true });
    try {
      const isSuper = role === 'super admin' || role === 'superadmin' || canViewAllLeads(permissions);
      if (isSuper) {
        const response = await api.LeadsAPI.fetchLeads(branchId, page, limit);
        set({ 
          leads: response.data as Lead[],
          pagination: response.meta
        });
      } else {
        console.log("User is restricted to their own leads.");
        const response = await api.LeadsAPI.getCounsellorLeads(userId, branchId, page, limit);
        set({ 
          leads: response.data as Lead[],
          pagination: response.meta
        });
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

  getAgentLeads: async (agentId: string, branchId?: string, page = 1, limit = 10) => {
    set({ loading: true });
    try {
      const response = await api.LeadsAPI.getAgentLeads(agentId, branchId, page, limit);
      set({ 
        leads: response.data as Lead[],
        pagination: response.meta
      });
    } catch (error) {
      console.error("Error fetching agent leads:", error);
      throw error;
    }
    set({ loading: false });
  },

  getCounsellorLeads: async (counsellorId: string, branchId?: string, page = 1, limit = 10) => {
    set({ loading: true });
    try {
      const response = await api.LeadsAPI.getCounsellorLeads(counsellorId, branchId, page, limit);
      set({ 
        leads: response.data as Lead[],
        pagination: response.meta
      });
    } catch (error) {
      console.error("Error fetching counsellor leads:", error);
      throw error;
    }
    set({ loading: false });
  },

  addLead: async (lead) => {
    try {
      // Strip internal/redundant fields before sending to CreateLeadDto
      const { 
        id, 
        created_at, 
        partners_leads_assigned_toTopartners, 
        ...payload 
      } = lead as any;
      
      const newLead = await api.LeadsAPI.createLead(payload);
      set((state) => ({ leads: [...state.leads, newLead] }));
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
      // Strip internal/redundant fields before sending to UpdateLeadDto
      const { 
        id: _id, 
        created_at, 
        partners_leads_assigned_toTopartners, 
        ...payload 
      } = updates as any;

      const updatedLead = await api.LeadsAPI.updateLead(id, payload);
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

  reset: () => set({ 
    leads: [], 
    loading: false, 
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0, counts: {} } 
  }),
}));
