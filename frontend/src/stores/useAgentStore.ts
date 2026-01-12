import { create } from "zustand";
import api from "@/lib/api";

export interface Agent {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  password?: string;
  agency_name: string;
  website?: string;
  region: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postal_code?: string;
  business_reg_no?: string;
  established_year?: number;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  is_active: boolean;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

interface AgentState {
  agents: Agent[];
  loading: boolean;
  fetchAgents: (status?: string) => Promise<void>;
  fetchAgentById: (id: string) => Promise<Agent | null>;
  addAgent: (agent: any) => Promise<void>;
  updateStatus: (id: string, status: "APPROVED" | "REJECTED", reason?: string) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>; // Added deleteAgent
  reset: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  loading: false,

  fetchAgents: async (status) => {
    set({ loading: true });
    try {
      const data = await api.AgentsAPI.getAll(status);
      set({ agents: data as Agent[] });
    } catch (error: any) {
      console.error("Error fetching agents:", error);
    } finally {
      set({ loading: false });
    }
  },

  fetchAgentById: async (id) => {
    try {
      const data = await api.AgentsAPI.getById(id);
      return data as Agent;
    } catch (error) {
      console.error("Error fetching agent:", error);
      return null;
    }
  },

  addAgent: async (agentData) => {
    try {
      const response = await api.AgentsAPI.onboard(agentData);
      set((state) => ({ agents: [response, ...state.agents] }));
    } catch (error) {
      console.error("Error adding agent:", error);
      throw error;
    }
  },

  updateStatus: async (id, status, reason) => {
    try {
      const response = await api.AgentsAPI.updateStatus(id, status, reason);
      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === id ? { ...agent, ...response } : agent
        ),
      }));
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  },

  deleteAgent: async (id) => {
    try {
       await api.AgentsAPI.delete(id); 
       set((state) => ({
         agents: state.agents.filter((a) => a.id !== id)
       }));
    } catch (error) {
       console.error("Error deleting agent:", error);
       throw error;
    }
  },
  
  reset: () => set({ agents: [], loading: false }),
}));