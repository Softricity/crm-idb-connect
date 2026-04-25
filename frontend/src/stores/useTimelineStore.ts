import { create } from "zustand";
import api from "@/lib/api";

export interface Timeline {
  id?: string;
  lead_id: string;
  event_type: string;
  old_state?: any;
  new_state?: any;
  source?: string;
  actor_name?: string;
  created_by: string | null;
  created_at?: string;
  partner?: { name: string };
  lead?: { name: string }; // Renamed from leads
}

interface TimelineState {
  timeline: Timeline[];
  globalTimeline: Timeline[]; // New State
  loading: boolean;
  timelineByLead: Record<string, Timeline[]>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
  globalPagination: { total: number; page: number; limit: number; totalPages: number };

  fetchTimelineByLeadId: (leadId: string, page?: number, limit?: number) => Promise<void>;
  fetchGlobalTimeline: (page?: number, limit?: number) => Promise<void>; // New Action
  addTimelineEvent: (event: Omit<Timeline, "id" | "partner" | "created_at">) => Promise<void>;
  fetchAllTimelines: (leadIds: string[]) => Promise<void>;
  reset: () => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timeline: [],
  globalTimeline: [], // Init
  loading: false,
  timelineByLead: {},
  pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
  globalPagination: { total: 0, page: 1, limit: 20, totalPages: 0 },

  fetchTimelineByLeadId: async (leadId, page = 1, limit = 20) => {
    set({ loading: true });
    try {
      const resp = await api.TimelineAPI.fetchTimelineByLeadId(leadId, page, limit);
      const rows = Array.isArray(resp) ? resp : (resp?.data || []);
      const meta = resp?.meta || {
        total: rows.length,
        page,
        limit,
        totalPages: Math.ceil(rows.length / Math.max(limit, 1)),
      };
      set((state) => ({ 
        timeline: rows as Timeline[],
        timelineByLead: { ...state.timelineByLead, [leadId]: rows as Timeline[] },
        pagination: meta
      }));
    } catch (error: any) {
      console.error("Error fetching timeline:", error.message || error);
    }
    set({ loading: false });
  },

  // New Action Implementation
  fetchGlobalTimeline: async (page = 1, limit = 20) => {
    set({ loading: true });
    try {
      const resp = await api.TimelineAPI.fetchGlobalTimeline(page, limit);
      const rows = Array.isArray(resp) ? resp : (resp?.data || []);
      const meta = resp?.meta || {
        total: rows.length,
        page,
        limit,
        totalPages: Math.ceil(rows.length / Math.max(limit, 1)),
      };
      set({ 
        globalTimeline: rows as Timeline[],
        globalPagination: meta
      });
    } catch (error: any) {
      console.error("Error fetching global timeline:", error.message || error);
    }
    set({ loading: false });
  },

  addTimelineEvent: async (event) => {
    try {
      const data = await api.TimelineAPI.createTimelineEvent(event);
      set((state) => ({
        timeline: [data, ...state.timeline],
        globalTimeline: [data, ...state.globalTimeline] // Update global list too
      }));
    } catch (error) {
      console.error("Error adding timeline event:", error);
      throw error;
    }
  },

  fetchAllTimelines: async (leadIds: string[]) => {
    if (!leadIds?.length) return;
    set({ loading: true });
    try {
      const data = await api.TimelineAPI.fetchAllTimelines(leadIds);
      const byLead: Record<string, Timeline[]> = {};
      for (const id of leadIds) byLead[id] = [];
      for (const row of data) {
        if (!byLead[row.lead_id]) byLead[row.lead_id] = [];
        byLead[row.lead_id].push(row);
      }
      set({ timelineByLead: byLead, loading: false });
    } catch (error: any) {
      set({ loading: false });
      throw new Error(error.message || error);
    }
  },
  
  reset: () => set({ 
    timeline: [], 
    globalTimeline: [], 
    loading: false, 
    timelineByLead: {},
    pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    globalPagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
  }),
}));
