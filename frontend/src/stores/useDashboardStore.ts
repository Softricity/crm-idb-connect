import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import {
  startOfTodayLocal,
  endOfTodayLocal,
  lastNDaysLocal,
} from "@/lib/dates";
import { Lead } from "./useLeadStore";

const supabase = createClient();

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

  fetchDashboardLeads: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  leads: [],
  loading: false,
  error: undefined,
  metrics: { todaysLeads: 0, converted: 0, rejected: 0, total: 0 },
  byStatus: {},
  bySource: {},
  last7Days: [],

  fetchDashboardLeads: async () => {
    set({ loading: true, error: undefined });

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("type", "lead")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Dashboard] fetchLeads error:", error.message);
      set({ loading: false, error: error.message });
      return;
    }

    const leads = (data ?? []) as Lead[];

    // === Metrics ===
    const start = startOfTodayLocal();
    const end = endOfTodayLocal();

    const todaysLeads = leads.filter((l) => {
      const d = new Date(l?.created_at??"");
      return d >= start && d <= end;
    }).length;

    const converted = leads.filter((l) => l.status === "converted").length;
    const rejected = leads.filter((l) => l.status === "rejected").length;
    const total = leads.length;

    // === Group by Status & Source ===
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    leads.forEach((l) => {
      const status = l.status || "unknown";
      byStatus[status] = (byStatus[status] || 0) + 1;

      const src = l.utm_source || "unknown";
      bySource[src] = (bySource[src] || 0) + 1;
    });

    // === Last 7 Days ===
    const days = lastNDaysLocal(7);
    const last7Days = days.map((day) => {
      const startDay = new Date(day);
      const endDay = new Date(day);
      endDay.setHours(23, 59, 59, 999);
      const count = leads.filter((l) => {
        const d = new Date(l?.created_at ?? "");
        return d >= startDay && d <= endDay;
      }).length;
      return {
        label: day.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        date: day.toISOString(),
        count,
      };
    });

    set({
      leads,
      metrics: { todaysLeads, converted, rejected, total },
      byStatus,
      bySource,
      last7Days,
      loading: false,
    });
  },

  refresh: async () => {
    await get().fetchDashboardLeads();
  },
}));
