// store/followup.ts
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface FollowupComment {
  id?: string;
  text: string;
  followup_id: string;
  created_at?: string;
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
  addFollowup: (
    followup: Omit<Followup, "id" | "partner" | "comments">
  ) => Promise<void>;
  updateFollowup: (id: string, updates: Partial<Followup>) => Promise<void>;
  deleteFollowup: (id: string) => Promise<void>;

  addComment: (
    comment: Omit<FollowupComment, "id" | "created_at">
  ) => Promise<void>;
  fetchCommentsByFollowupId: (followupId: string) => Promise<FollowupComment[]>;
  deleteAllCommentsForFollowup: (followupId: string) => Promise<void>;

  markComplete: (id: string) => Promise<void>;
  extendDueDate: (id: string, newDate: string) => Promise<void>;
}

export const useFollowupStore = create<FollowupState>((set, get) => ({
  followups: [],
  loading: false,

  fetchFollowupsByLeadId: async (leadId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("followups")
      .select(
        `
        *,
        partner:created_by(name),
        comments:followup_comments(*)
      `
      )
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching followups:", error.message);
    } else {
      set({ followups: data as Followup[] });
    }
    set({ loading: false });
  },

  addFollowup: async (followup) => {
    const { data, error } = await supabase
      .from("followups")
      .insert(followup)
      .select("*, partner:created_by(name)");

    if (error) {
      console.error("Error adding followup:", error.message);
      throw error;
    }

    set((state) => ({
      followups: [...(data as Followup[]), ...state.followups],
    }));
  },

  updateFollowup: async (id, updates) => {
    const { data, error } = await supabase
      .from("followups")
      .update(updates)
      .eq("id", id)
      .select("*, partner:created_by(name)");

    if (error) {
      console.error("Error updating followup:", error.message);
      throw error;
    }
    set((state) => ({
      followups: state.followups.map((f) =>
        f.id === id ? { ...f, ...(data?.[0] as Followup) } : f
      ),
    }));
  },

  deleteFollowup: async (id) => {
    const { error } = await supabase.from("followups").delete().eq("id", id);
    if (error) {
      console.error("Error deleting followup:", error.message);
      throw error;
    }
    set((state) => ({
      followups: state.followups.filter((f) => f.id !== id),
    }));
  },

  addComment: async (comment) => {
    const { data, error } = await supabase
      .from("followup_comments")
      .insert(comment)
      .select();

    if (error) {
      console.error("Error adding comment:", error.message);
      throw error;
    }

    set((state) => ({
      followups: state.followups.map((f) =>
        f.id === comment.followup_id
          ? {
              ...f,
              comments: [...(f.comments || []), ...(data as FollowupComment[])],
            }
          : f
      ),
    }));
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

  deleteAllCommentsForFollowup: async (followupId) => {
    const { error } = await supabase
      .from("followup_comments")
      .delete()
      .eq("followup_id", followupId);

    if (error) {
      console.error("Error deleting comments for followup:", error.message);
      throw error;
    }

    // Update the local state to remove comments from the specific followup
    set((state) => ({
      followups: state.followups.map((f) =>
        f.id === followupId ? { ...f, comments: [] } : f
      ),
    }));
  },

  markComplete: async (id) => {
    const { data, error } = await supabase
      .from("followups")
      .update({ completed: true })
      .eq("id", id)
      .select("*, partner:created_by(name)");

    if (error) {
      console.error("Error marking complete:", error.message);
      throw error;
    }

    set((state) => ({
      followups: state.followups.map((f) =>
        f.id === id ? { ...f, ...(data?.[0] as Followup) } : f
      ),
    }));
  },

  extendDueDate: async (id, newDate) => {
    const { data, error } = await supabase
      .from("followups")
      .update({ due_date: newDate })
      .eq("id", id)
      .select("*, partner:created_by(name)");

    if (error) {
      console.error("Error extending due date:", error.message);
      throw error;
    }

    set((state) => ({
      followups: state.followups.map((f) =>
        f.id === id ? { ...f, ...(data?.[0] as Followup) } : f
      ),
    }));
  },
}));
