import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { TimelineEvent } from "@/lib/utils"; // import enums

const supabase = createClient();

export interface Lead {
  id?: string;
  name: string;
  mobile: string;
  email: string;
  alternate_mobile?: string | null;
  type: string;
  city: string;
  purpose: string;
  preferred_country?: string | null;
  status: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  assigned_to?: string | null;
  created_at?: string;
  created_by?: string | null;
  reason?: string | null;
}

interface LeadState {
  leads: Lead[];
  loading: boolean;
  fetchLeads: () => Promise<void>;
  fetchLeadById: (id: string) => Promise<Lead | null>;
  getAgentLeads: (agentId: string) => Promise<void>;
  addLead: (lead: Omit<Lead, "id" | "created_at">) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
}

export const useLeadStore = create<LeadState>((set) => ({
  leads: [],
  loading: false,

  fetchLeads: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching leads:", error.message);
    } else {
      set({ leads: data as Lead[] });
    }
    set({ loading: false });
  },

  fetchLeadById: async (id) => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Error fetching lead by id:", error.message);
      throw error;
    }
    return data as Lead;
  },

  getAgentLeads: async (agentId: string) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("created_by", agentId);
    if (error) {
      console.error("Error fetching agent leads:", error.message);
      throw error;
    } else {
      set({ leads: data as Lead[] });
    }
    set({ loading: false });
  },

  addLead: async (lead) => {
    const sanitizedLead = Object.fromEntries(
      Object.entries(lead).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );

    const { data, error } = await supabase
      .from("leads")
      .insert([sanitizedLead])
      .select();

    if (error) {
      console.error("Error adding lead:", error.message);
      throw error;
    }

    const newLead = data?.[0] as Lead;
    set((state) => ({ leads: [...state.leads, newLead] }));

    // log timeline
    await supabase.from("timeline").insert({
      lead_id: newLead.id,
      event_type: TimelineEvent.LEAD_CREATED,
      new_state: `Lead created for ${newLead.name}`, // Storing a simple string
      created_by: newLead.created_by,
    });
  },

  updateLead: async (id, updates) => {
    // 1. Fetch the state of the lead before the update
    const { data: oldData } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldData) {
        console.error("Could not find lead to update.");
        return;
    }

    // 2. Perform the update
    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating lead:", error.message);
      throw error;
    }

    const updatedLead = data as Lead;

    // 3. Update the local Zustand state
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === id ? { ...lead, ...updatedLead } : lead
      ),
    }));

    // 4. *** MODIFIED SECTION: Log specific changes to the timeline ***
    const fieldsToTrack = [
      { key: 'name', eventType: TimelineEvent.LEAD_NAME_CHANGED },
      { key: 'mobile', eventType: TimelineEvent.LEAD_PHONE_CHANGED },
      { key: 'email', eventType: TimelineEvent.LEAD_EMAIL_CHANGED },
      { key: 'purpose', eventType: TimelineEvent.LEAD_PURPOSE_CHANGED },
      { key: 'assigned_to', eventType: TimelineEvent.LEAD_OWNER_CHANGED },
      { key: 'status', eventType: TimelineEvent.LEAD_STATUS_CHANGED },
    ] as const; // `as const` provides better type safety

    const timelineEvents = [];

    for (const field of fieldsToTrack) {
      const key = field.key;
      const newValue = updates[key];
      const oldValue = oldData[key];

      // Check if the field is in the updates and its value has actually changed
      if (newValue !== undefined && newValue !== oldValue) {
        timelineEvents.push({
          lead_id: updatedLead.id!,
          event_type: field.eventType,
          old_state: oldValue ?? "N/A", // Store old value as string
          new_state: newValue,          // Store new value as string
          created_by: updatedLead.created_by,
        });
      }
    }

    // Insert all detected change events into the timeline in a single call
    if (timelineEvents.length > 0) {
        await supabase.from("timeline").insert(timelineEvents);
    }
  },
}));