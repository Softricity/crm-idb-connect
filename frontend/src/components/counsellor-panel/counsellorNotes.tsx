"use client";

import React from "react";
import { useNoteStore } from "@/stores/useNoteStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Card, CardBody, Button, Textarea, Spinner } from "@heroui/react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CounsellorNotesProps {
  leadId: string;
}

export function CounsellorNotes({ leadId }: CounsellorNotesProps) {
  const user = useAuthStore((state) => state.user);
  const { notes, loading, fetchNotesByLeadId, addNote, deleteNote } = useNoteStore();
  const [newNote, setNewNote] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

  React.useEffect(() => {
    if (leadId) {
      fetchNotesByLeadId(leadId);
    }
  }, [leadId, fetchNotesByLeadId]);

  const leadNotes = React.useMemo(() => {
    return notes.filter((n) => n.lead_id === leadId);
  }, [notes, leadId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setIsAdding(true);
    try {
      await addNote({
        lead_id: leadId,
        text: newNote,
        created_by: user?.id || "",
      });
      toast.success("Note added successfully");
      setNewNote("");
      fetchNotesByLeadId(leadId);
    } catch (error) {
      toast.error("Failed to add note");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      toast.success("Note deleted successfully");
      fetchNotesByLeadId(leadId);
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full mt-6 space-y-6">
      {/* Add New Note */}
      <Card>
        <CardBody className="space-y-4">
          <h3 className="text-lg font-semibold">Add New Note</h3>
          <Textarea
            label="Note Content"
            placeholder="Enter your note here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            minRows={4}
          />
          <div className="flex justify-end">
            <Button
              color="primary"
              onPress={handleAddNote}
              isLoading={isAdding}
              startContent={<Plus className="h-4 w-4" />}
            >
              Add Note
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Notes History</h3>
        {leadNotes.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-center text-gray-500">No notes yet</p>
            </CardBody>
          </Card>
        ) : (
          leadNotes.map((note) => (
            <Card key={note.id}>
              <CardBody className="space-y-2">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-gray-700 flex-1">{note.text}</p>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    isIconOnly
                    onPress={() => handleDeleteNote(note.id!)}
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    By: {note.partner?.name || "Unknown"}
                  </span>
                  {note.created_at && (
                    <span>
                      {format(new Date(note.created_at), "PPp")}
                    </span>
                  )}
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
