// store/timeline.ts
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timeline: [],
  loading: false,
  timelineByLead: {},

  fetchTimelineByLeadId: async (leadId) => {
    set({ loading: true });

    const { data, error } = await supabase
      .from("timeline")
      .select(
        `
        *,
        partner:created_by(name)
      `
      )
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching timeline:", error.message);
    } else {
      set({ timeline: data as Timeline[] });
    }
    set({ loading: false });
  },

  addTimelineEvent: async (event) => {
    const { data, error } = await supabase
      .from("timeline")
      .insert(event)
      .select("*, partner:created_by(name)");

    if (error) {
      console.error("Error adding timeline event:", error.message);
      throw error;
    }

    set((state) => ({
      timeline: [...(data as Timeline[]), ...state.timeline],
    }));
  },
  fetchAllTimelines: async (leadIds: string[]) => {
    if (!leadIds?.length) return;

    set({ loading: true });

    const { data, error } = await supabase
      .from("timeline")
      .select(
        `
        id,
        lead_id,
        event_type,
        old_state,
        new_state,
        created_by,
        created_at,
        partner:created_by(name)
      `
      )
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false });

    if (error) {
      set({ loading: false });
      throw new Error(error.message);
    }

    const rows = (data ?? []).map((row: any) => ({
      ...row,
      partner:
        Array.isArray(row.partner) && row.partner.length > 0
          ? row.partner[0]
          : row.partner,
    })) as Timeline[];
    const byLead: Record<string, Timeline[]> = {};
    for (const id of leadIds) byLead[id] = [];
    for (const row of rows) {
      if (!byLead[row.lead_id]) byLead[row.lead_id] = [];
      byLead[row.lead_id].push(row);
    }

    set({ timelineByLead: byLead, loading: false });
  },
}));
