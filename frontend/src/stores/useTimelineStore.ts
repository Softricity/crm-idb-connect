import { create } from "zustand";
import api from "@/lib/api";

export interface Timeline {
  id?: string;
  lead_id: string;
  event_type: string;
  old_state?: any;
  new_state?: any;
  created_by: string;
  created_at?: string;
  partner?: { name: string };
  leads?: { name: string }; // Added lead name
}

interface TimelineState {
  timeline: Timeline[];
  globalTimeline: Timeline[]; // New State
  loading: boolean;
  timelineByLead: Record<string, Timeline[]>;

  fetchTimelineByLeadId: (leadId: string) => Promise<void>;
  fetchGlobalTimeline: () => Promise<void>; // New Action
  addTimelineEvent: (event: Omit<Timeline, "id" | "partner" | "created_at">) => Promise<void>;
  fetchAllTimelines: (leadIds: string[]) => Promise<void>;
  reset: () => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timeline: [],
  globalTimeline: [], // Init
  loading: false,
  timelineByLead: {},

  fetchTimelineByLeadId: async (leadId) => {
    set({ loading: true });
    try {
      const data = await api.TimelineAPI.fetchTimelineByLeadId(leadId);
      set({ timeline: data as Timeline[] });
    } catch (error: any) {
      console.error("Error fetching timeline:", error.message || error);
    }
    set({ loading: false });
  },

  // New Action Implementation
  fetchGlobalTimeline: async () => {
    set({ loading: true });
    try {
      const data = await api.TimelineAPI.fetchGlobalTimeline();
      set({ globalTimeline: data as Timeline[] });
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
  
  reset: () => set({ timeline: [], globalTimeline: [], loading: false, timelineByLead: {} }),
}));