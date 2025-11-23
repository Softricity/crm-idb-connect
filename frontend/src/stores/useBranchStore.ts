import { create } from "zustand";
import api from "@/lib/api";

export interface Branch {
  id: string;
  name: string;
  code?: string;
  type: "HeadOffice" | "Regional" | "Branch";
  address?: string;
  phone?: string;
  parent_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface BranchState {
  branches: Branch[];
  selectedBranch: Branch | null;
  loading: boolean;
  
  fetchBranches: () => Promise<void>;
  setSelectedBranch: (branch: Branch | null) => void;
  getBranchById: (id: string) => Branch | null;
}

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: [],
  selectedBranch: null,
  loading: false,

  fetchBranches: async () => {
    set({ loading: true });
    try {
      const data = await api.BranchesAPI.fetchBranches();
      set({ branches: data as Branch[] });
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      set({ loading: false });
    }
  },

  setSelectedBranch: (branch: Branch | null) => {
    set({ selectedBranch: branch });
  },

  getBranchById: (id: string) => {
    return get().branches.find((b) => b.id === id) || null;
  },
}));
