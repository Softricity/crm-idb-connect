import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { TimelineEvent } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore"; // ⬅️ Import auth store

const supabase = createClient();

export interface FollowupComment {
  id?: string;
  text: string;
  followup_id: string;
  created_at?: string;
  created_by?: string; // ⬅️ Added field for accuracy
}

export interface Followup {
  id?: string;
  title: string;
  lead_id: string;
  completed: boolean;
  created_by: string;
  created_at?: string;
  due_date?: string;
  partner?: {
    name: string;
  };
  comments?: FollowupComment[];
}

interface FollowupState {
  followups: Followup[];
  loading: boolean;
  fetchFollowupsByLeadId: (leadId: string) => Promise<void>;
  addFollowup: (followup: Omit<Followup, "id" | "partner" | "comments">) => Promise<void>;
  updateFollowup: (id: string, updates: Partial<Followup>) => Promise<void>;
  deleteFollowup: (id: string) => Promise<void>;
  addComment: (comment: Omit<FollowupComment, "id" | "created_at">) => Promise<void>;
  fetchCommentsByFollowupId: (followupId: string) => Promise<FollowupComment[]>;
  deleteAllCommentsForFollowup: (followupId: string) => Promise<void>;
  markComplete: (id: string) => Promise<void>;
  extendDueDate: (id: string, newDate: string) => Promise<void>;
}

// Using `get` to access other stores without causing dependency cycles
export const useFollowupStore = create<FollowupState>((set, get) => ({
  followups: [],
  loading: false,

  fetchFollowupsByLeadId: async (leadId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("followups")
      .select("*, partner:created_by(name), comments:followup_comments(*)")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching followups:", error.message);
    else set({ followups: data as Followup[] });
    set({ loading: false });
  },

  addFollowup: async (followup) => {
    const { data, error } = await supabase
      .from("followups")
      .insert(followup)
      .select("*, partner:created_by(name)")
      .single();

    if (error) throw error;
    
    set((state) => ({ followups: [data, ...state.followups] }));

    await supabase.from("timeline").insert({
      lead_id: data.lead_id,
      event_type: TimelineEvent.LEAD_FOLLOWUP_ADDED,
      new_state: data.title,
      created_by: data.created_by,
    });
  },

  updateFollowup: async (id, updates) => {
    const { data: oldData } = await supabase.from("followups").select("title, lead_id, created_by").eq("id", id).single();
    if (!oldData) throw new Error("Followup not found");
    
    const { data, error } = await supabase.from("followups").update(updates).eq("id", id).select("*, partner:created_by(name)").single();
    if (error) throw error;

    set((state) => ({ followups: state.followups.map((f) => (f.id === id ? data : f)) }));

    if (updates.title && updates.title !== oldData.title) {
        await supabase.from("timeline").insert({
            lead_id: data.lead_id,
            event_type: TimelineEvent.LEAD_FOLLOWUP_UPDATED,
            old_state: oldData.title,
            new_state: data.title,
            created_by: data.created_by,
        });
    }
  },

  deleteFollowup: async (id) => {
    const { data: oldData } = await supabase.from("followups").select("title, lead_id, created_by").eq("id", id).single();
    if (!oldData) throw new Error("Followup not found");

    const { error } = await supabase.from("followups").delete().eq("id", id);
    if (error) throw error;
    
    set((state) => ({ followups: state.followups.filter((f) => f.id !== id) }));

    await supabase.from("timeline").insert({
        lead_id: oldData.lead_id,
        event_type: TimelineEvent.LEAD_FOLLOWUP_DELETED,
        old_state: oldData.title,
        created_by: oldData.created_by,
    });
  },

  addComment: async (comment) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error("User not authenticated");

    const { data: followup } = await supabase.from("followups").select("lead_id").eq("id", comment.followup_id).single();
    if (!followup) throw new Error("Parent followup not found.");
    
    const commentToInsert = { ...comment, created_by: user.id };
    const { data, error } = await supabase.from("followup_comments").insert(commentToInsert).select().single();
    if (error) throw error;
    
    set((state) => ({
      followups: state.followups.map((f) =>
        f.id === comment.followup_id
          ? { ...f, comments: [...(f.comments || []), data] }
          : f
      ),
    }));

    await supabase.from("timeline").insert({
      lead_id: followup.lead_id, // ✅ Correct lead_id
      event_type: TimelineEvent.LEAD_FOLLOWUP_COMMENT_ADDED,
      new_state: data.text,
      created_by: comment.created_by,
    });
  },

  deleteAllCommentsForFollowup: async (followupId) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error("User not authenticated");

    const { data: followup } = await supabase.from("followups").select("lead_id").eq("id", followupId).single();
    if (!followup) throw new Error("Parent followup not found.");

    const { error } = await supabase.from("followup_comments").delete().eq("followup_id", followupId);
    if (error) throw error;
    
    set((state) => ({ followups: state.followups.map((f) => f.id === followupId ? { ...f, comments: [] } : f) }));
    
    await supabase.from("timeline").insert({
        lead_id: followup.lead_id, // ✅ Correct lead_id
        event_type: TimelineEvent.LEAD_FOLLOWUP_COMMENT_DELETED,
        old_state: `All comments deleted for followup`,
        created_by: user.id,
    });
  },

  markComplete: async (id) => {
    const { data, error } = await supabase.from("followups").update({ completed: true }).eq("id", id).select("*, partner:created_by(name)").single();
    if (error) throw error;

    set((state) => ({ followups: state.followups.map((f) => f.id === id ? data : f) }));
    
    await supabase.from("timeline").insert({
        lead_id: data.lead_id,
        event_type: TimelineEvent.LEAD_FOLLOWUP_COMPLETED,
        new_state: data.title,
        created_by: data.created_by,
    });
  },

  extendDueDate: async (id, newDate) => {
    const { data: oldData } = await supabase.from("followups").select("due_date, lead_id, created_by").eq("id", id).single();
    if (!oldData) throw new Error("Followup not found");

    const { data, error } = await supabase.from("followups").update({ due_date: newDate }).eq("id", id).select("*, partner:created_by(name)").single();
    if (error) throw error;

    set((state) => ({ followups: state.followups.map((f) => f.id === id ? data : f) }));
    
    await supabase.from("timeline").insert({
        lead_id: data.lead_id,
        event_type: TimelineEvent.LEAD_FOLLOWUP_DATE_EXTENDED,
        old_state: oldData.due_date,
        new_state: data.due_date,
        created_by: data.created_by,
    });
  },
  fetchCommentsByFollowupId: async (followupId) => {
    const { data, error } = await supabase
      .from("followup_comments")
      .select("*")
      .eq("followup_id", followupId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error.message);
      return [];
    }
    return data as FollowupComment[];
  },
}));
