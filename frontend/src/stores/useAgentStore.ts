// store/agent.ts
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface Agent {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  agency_name: string;
  address: string;
  city: string;
  state: string;
  area: string;
  zone: string;
  association_type: string;
  association_date: string; // ISO date string
  agreement_start_date: string;
  agreement_end_date: string;
  remarks?: string | null;
  created_at?: string;
}

interface AgentState {
  agents: Agent[];
  loading: boolean;
  fetchAgents: () => Promise<void>;
  fetchAgentById: (id: string) => Promise<Agent | null>;
  addAgent: (agent: Omit<Agent, "id" | "created_at">) => Promise<void>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  loading: false,

  fetchAgents: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from("agents").select("*");
    if (error) {
      console.error("Error fetching agents:", error.message);
    } else {
      set({ agents: data as Agent[] });
    }
    set({ loading: false });
  },

  fetchAgentById: async (id) => {
    const { data, error } = await supabase.from("agents").select("*").eq("id", id).single();
    if (error) {
      console.error("Error fetching agent by id:", error.message);
      return null;
    }
    return data as Agent;
  },

  addAgent: async (agent) => {
    const sanitizedAgent = Object.fromEntries(
      Object.entries(agent).map(([key, value]) => [key, value === "" ? null : value])
    );
    const { data, error } = await supabase.from("agents").insert([sanitizedAgent]).select();
    if (error) {
      console.error("Error adding agent:", error.message);
      return;
    }
    set((state) => ({ agents: [...state.agents, ...(data as Agent[])] }));
  },

  updateAgent: async (id, updates) => {
    const { data, error } = await supabase
      .from("agents")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) {
      console.error("Error updating agent:", error.message);
      return;
    }
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id ? { ...agent, ...(data?.[0] as Agent) } : agent
      ),
    }));
  },

  deleteAgent: async (id) => {
    const { error } = await supabase.from("agents").delete().eq("id", id);
    if (error) {
      console.error("Error deleting agent:", error.message);
      return;
    }
    set((state) => ({
      agents: state.agents.filter((agent) => agent.id !== id),
    }));
  },
}));
