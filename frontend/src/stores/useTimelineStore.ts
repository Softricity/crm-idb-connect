// store/timeline.ts
import { create } from "zustand";
import api from "@/lib/api";

export interface Timeline {
  id?: string;
  lead_id: string;
  event_type: string; // timeline_event enum
  old_state?: any; // stored as JSONB
  new_state?: any; // stored as JSONB
  created_by: string;
  created_at?: string;
  partner?: {
    name: string;
  };
}

interface TimelineState {
  timeline: Timeline[];
  loading: boolean;
  timelineByLead: Record<string, Timeline[]>;

  fetchTimelineByLeadId: (leadId: string) => Promise<void>;
  addTimelineEvent: (
    event: Omit<Timeline, "id" | "partner" | "created_at">
  ) => Promise<void>;
  fetchAllTimelines: (leadIds: string[]) => Promise<void>;
  reset: () => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timeline: [],
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

  addTimelineEvent: async (event) => {
    try {
      const data = await api.TimelineAPI.createTimelineEvent(event);
      set((state) => ({
        timeline: [data, ...state.timeline],
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
  reset: () => set({ timeline: [], loading: false, timelineByLead: {} }),
}));
