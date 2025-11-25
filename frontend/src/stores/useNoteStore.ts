import { create } from "zustand";
import api from "@/lib/api";

export interface Note {
  id?: string;
  text: string;
  lead_id: string;
  partner?: {
    name: string;
  };
  created_by: string;
  created_at?: string;
}

interface NoteState {
  notes: Note[];
  loading: boolean;
  fetchNotesByLeadId: (leadId: string) => Promise<void>;
  addNote: (note: Omit<Note, "id" | "created_at" | "partner">) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  clearNotes: () => void;
  reset: () => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  loading: false,

  fetchNotesByLeadId: async (leadId) => {
    set({ loading: true });
    try {
      const data = await api.NotesAPI.fetchNotesByLeadId(leadId);
      set({ notes: data as Note[] });
    } catch (error: any) {
      console.error("Error fetching notes:", error.message || error);
    }
    set({ loading: false });
  },

  addNote: async (note) => {
    try {
      const data = await api.NotesAPI.createNote(note);
      set((state) => ({ notes: [data, ...state.notes] }));
      // Timeline logging handled by backend
    } catch (error: any) {
      console.error("Error adding note:", error.message || error);
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    try {
      const data = await api.NotesAPI.updateNote(id, updates);
      set((state) => ({
        notes: state.notes.map((note) => (note.id === id ? data : note)),
      }));
      // Timeline logging handled by backend
    } catch (error: any) {
      console.error("Error updating note:", error.message || error);
      throw error;
    }
  },

  deleteNote: async (id) => {
    try {
      await api.NotesAPI.deleteNote(id);
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
      }));
      // Timeline logging handled by backend
    } catch (error: any) {
      console.error("Error deleting note:", error.message || error);
      throw error;
    }
  },

  clearNotes: () => set({ notes: [] }),
  reset: () => set({ notes: [], loading: false }),
}));