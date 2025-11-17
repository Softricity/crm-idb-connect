import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { TimelineEvent } from "@/lib/utils"; // ⬅️ import enums

const supabase = createClient();

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
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  loading: false,

  fetchNotesByLeadId: async (leadId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("notes")
      .select("*, partner:created_by(name)")
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
      .select("*, partner:created_by(name)")
      .single();

    if (error) {
      console.error("Error adding note:", error.message);
      throw error;
    }

    // 📌 Log timeline event with the raw text
    await supabase.from("timeline").insert({
      lead_id: data.lead_id,
      event_type: TimelineEvent.LEAD_NOTE_ADDED,
      new_state: data.text, // ✅ CHANGED
      created_by: data.created_by,
    });

    set((state) => ({ notes: [data, ...state.notes] }));
  },

  updateNote: async (id, updates) => {
    const { data: oldData } = await supabase.from("notes").select("*").eq("id", id).single();
    if (!oldData) throw new Error("Note not found");

    const { data, error } = await supabase
      .from("notes")
      .update(updates)
      .eq("id", id)
      .select("*, partner:created_by(name)")
      .single();

    if (error) {
      console.error("Error updating note:", error.message);
      throw error;
    }

    // 📌 Log timeline event with raw text
    await supabase.from("timeline").insert({
      lead_id: data.lead_id,
      event_type: TimelineEvent.LEAD_NOTE_UPDATED,
      old_state: oldData.text, // ✅ CHANGED
      new_state: data.text, // ✅ CHANGED
      created_by: updates.created_by,
    });

    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? data : note)),
    }));
  },

  deleteNote: async (id) => {
    const { data: oldData } = await supabase.from("notes").select("*").eq("id", id).single();
    if (!oldData) throw new Error("Note not found");

    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      console.error("Error deleting note:", error.message);
      throw error;
    }

    // 📌 Log timeline event with raw text
    await supabase.from("timeline").insert({
      lead_id: oldData.lead_id,
      event_type: TimelineEvent.LEAD_NOTE_DELETED,
      old_state: oldData.text, // ✅ CHANGED
      created_by: oldData.created_by,
    });

    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    }));
  },

  clearNotes: () => set({ notes: [] }),
}));