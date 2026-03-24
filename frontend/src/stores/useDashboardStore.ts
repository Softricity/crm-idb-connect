import { create } from "zustand";
import api from "@/lib/api";
import { Lead } from "./useLeadStore";

type StatusBuckets = Record<string, number>;
type SourceBuckets = Record<string, number>;

interface DashboardState {
  leads: Lead[];
  loading: boolean;
  error?: string;
  metrics: {
    todaysLeads: number;
    converted: number;
    rejected: number;
    total: number;
  };
  byStatus: StatusBuckets;
  bySource: SourceBuckets;
  last7Days: { label: string; date: string; count: number }[];
  topSelected: string;
  setTopSelected: (key: string) => void;

  fetchDashboardLeads: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  leads: [],
  loading: false,
  error: undefined,
  metrics: { todaysLeads: 0, converted: 0, rejected: 0, total: 0 },
  byStatus: {},
  bySource: {},
  last7Days: [],
  topSelected: "home",
  setTopSelected: (key: string) => set({ topSelected: key }),

  fetchDashboardLeads: async () => {
    set({ loading: true, error: undefined });

    try {
      const stats = await api.DashboardAPI.getStats();

      set({
        metrics: {
            todaysLeads: stats.metrics.todaysLeads,
            converted: stats.metrics.converted,
            rejected: stats.metrics.rejected,
            total: stats.metrics.total,
        },
        byStatus: stats.byStatus,
        bySource: stats.bySource,
        last7Days: stats.last7Days,
        loading: false,
      });
    } catch (error: any) {
      console.error("[Dashboard] fetchLeads error:", error.message || error);
      set({ loading: false, error: error.message || "Failed to fetch dashboard data" });
    }
  },

  refresh: async () => {
    await get().fetchDashboardLeads();
  },
  reset: () => set({ 
    leads: [], 
    loading: false, 
    error: undefined, 
    metrics: { todaysLeads: 0, converted: 0, rejected: 0, total: 0 }, 
    byStatus: {}, 
    bySource: {}, 
    last7Days: [], 
    topSelected: "home" 
  }),
}));
