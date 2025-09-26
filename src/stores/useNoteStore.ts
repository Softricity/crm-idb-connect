// store/note.ts
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface Note {
  id?: string;
  text: string;
  lead_id: string;
  created_by: string;
  created_at?: string;
}

interface NoteState {
  notes: Note[];
  loading: boolean;
  fetchNotesByLeadId: (leadId: string) => Promise<void>;
  addNote: (note: Omit<Note, "id" | "created_at">) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  clearNotes: () => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  loading: false,

  fetchNotesByLeadId: async (leadId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error.message);
    } else {
      set({ notes: data as Note[] });
    }
    set({ loading: false });
  },

  addNote: async (note) => {
    const { data, error } = await supabase
      .from("notes")
      .insert(note)
      .select();

    if (error) {
      console.error("Error adding note:", error.message);
      throw error;
    }

    set((state) => ({ notes: [...(data as Note[]), ...state.notes] }));
  },

  updateNote: async (id, updates) => {
    const { data, error } = await supabase
      .from("notes")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating note:", error.message);
      throw error;
    }
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...(data?.[0] as Note) } : note
      ),
    }));
  },

  deleteNote: async (id) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      console.error("Error deleting note:", error.message);
      throw error;
    }
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    }));
  },

  clearNotes: () => set({ notes: [] }),
}));
