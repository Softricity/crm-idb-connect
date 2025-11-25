import { create } from "zustand";
import api from "@/lib/api";

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  target_audience: "user" | "branch";
  branch_id?: string | null;
  users?: string[] | null; // Array of user IDs
  created_at?: string;
  created_by?: string;
  announcement_reads?: {
    user_id: string;
    read_at: string;
  }[];
}

interface AnnouncementState {
  announcements: Announcement[];
  loading: boolean;
  unreadCount: number;
  fetchAnnouncements: (filters?: { target_audience?: string; branch_id?: string }) => Promise<void>;
  fetchAnnouncementById: (id: string) => Promise<Announcement | null>;
  createAnnouncement: (announcement: Omit<Announcement, "id" | "created_at" | "created_by" | "announcement_reads">) => Promise<void>;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  reset: () => void;
}

export const useAnnouncementStore = create<AnnouncementState>((set) => ({
  announcements: [],
  loading: false,
  unreadCount: 0,

  fetchAnnouncements: async (filters) => {
    set({ loading: true });
    try {
      const data = await api.AnnouncementsAPI.getAll(filters);
      set({ announcements: data as Announcement[] });
    } catch (error: any) {
      console.error("Error fetching announcements:", error.message || error);
    }
    set({ loading: false });
  },

  fetchAnnouncementById: async (id) => {
    try {
      const data = await api.AnnouncementsAPI.getById(id);
      return data as Announcement;
    } catch (error) {
      console.error("Error fetching announcement by id:", error);
      throw error;
    }
  },

  createAnnouncement: async (announcement) => {
    try {
      const newAnnouncement = await api.AnnouncementsAPI.create(announcement);
      set((state) => ({ announcements: [newAnnouncement, ...state.announcements] }));
    } catch (error) {
      console.error("Error creating announcement:", error);
      throw error;
    }
  },

  updateAnnouncement: async (id, updates) => {
    try {
      const updatedAnnouncement = await api.AnnouncementsAPI.update(id, updates);
      set((state) => ({
        announcements: state.announcements.map((announcement) =>
          announcement.id === id ? { ...announcement, ...updatedAnnouncement } : announcement
        ),
      }));
    } catch (error) {
      console.error("Error updating announcement:", error);
      throw error;
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      await api.AnnouncementsAPI.delete(id);
      set((state) => ({
        announcements: state.announcements.filter((announcement) => announcement.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting announcement:", error);
      throw error;
    }
  },

  markAsRead: async (id) => {
    try {
      await api.AnnouncementsAPI.markAsRead(id);
      // Update local state to mark as read
      set((state) => ({
        announcements: state.announcements.map((announcement) =>
          announcement.id === id
            ? {
                ...announcement,
                announcement_reads: [
                  ...(announcement.announcement_reads || []),
                  { user_id: "", read_at: new Date().toISOString() },
                ],
              }
            : announcement
        ),
      }));
      // Refresh unread count
      await useAnnouncementStore.getState().fetchUnreadCount();
    } catch (error) {
      console.error("Error marking announcement as read:", error);
      throw error;
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await api.AnnouncementsAPI.getUnreadCount();
      set({ unreadCount: data.count || 0 });
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  },
  reset: () => set({ announcements: [], loading: false, unreadCount: 0 }),
}));
