import { create } from "zustand";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";

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
  followup_comments?: FollowupComment[];
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
    try {
      const data = await api.FollowupsAPI.fetchFollowupsByLeadId(leadId);
      set({ followups: data as Followup[] });
    } catch (error: any) {
      console.error("Error fetching followups:", error.message || error);
    }
    set({ loading: false });
  },

  addFollowup: async (followup) => {
    try {
      const data = await api.FollowupsAPI.createFollowup(followup);
      set((state) => ({ followups: [data, ...state.followups] }));
      // Timeline logging handled by backend
    } catch (error) {
      throw error;
    }
  },

  updateFollowup: async (id, updates) => {
    try {
      const data = await api.FollowupsAPI.updateFollowup(id, updates);
      set((state) => ({ followups: state.followups.map((f) => (f.id === id ? data : f)) }));
      // Timeline logging handled by backend
    } catch (error) {
      throw error;
    }
  },

  deleteFollowup: async (id) => {
    try {
      await api.FollowupsAPI.deleteFollowup(id);
      set((state) => ({ followups: state.followups.filter((f) => f.id !== id) }));
      // Timeline logging handled by backend
    } catch (error) {
      throw error;
    }
  },

  addComment: async (comment) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error("User not authenticated");

    try {
      const commentToInsert = { ...comment, created_by: user.id };
      const data = await api.FollowupsAPI.createComment(commentToInsert);
      
      set((state) => ({
        followups: state.followups.map((f) =>
          f.id === comment.followup_id
            ? { ...f, followup_comments: [...(f.followup_comments || []), data] }
            : f
        ),
      }));
      // Timeline logging handled by backend
    } catch (error) {
      throw error;
    }
  },

  deleteAllCommentsForFollowup: async (followupId) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error("User not authenticated");

    try {
      await api.FollowupsAPI.deleteAllComments(followupId);
      set((state) => ({ followups: state.followups.map((f) => f.id === followupId ? { ...f, comments: [] } : f) }));
      // Timeline logging handled by backend
    } catch (error) {
      throw error;
    }
  },

  markComplete: async (id) => {
    try {
      const data = await api.FollowupsAPI.markComplete(id);
      set((state) => ({ followups: state.followups.map((f) => f.id === id ? data : f) }));
      // Timeline logging handled by backend
    } catch (error) {
      throw error;
    }
  },

  extendDueDate: async (id, newDate) => {
    try {
      const data = await api.FollowupsAPI.extendDueDate(id, newDate);
      set((state) => ({ followups: state.followups.map((f) => f.id === id ? data : f) }));
      // Timeline logging handled by backend
    } catch (error) {
      throw error;
    }
  },
  fetchCommentsByFollowupId: async (followupId) => {
    try {
      const data = await api.FollowupsAPI.fetchCommentsByFollowupId(followupId);
      return data as FollowupComment[];
    } catch (error: any) {
      console.error("Error fetching comments:", error.message || error);
      return [];
    }
  },
}));
