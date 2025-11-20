"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNoteStore, Note } from "@/stores/useNoteStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Textarea,
  Button,
  Card,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from "@heroui/react";
import { MoreVertical } from "lucide-react";

const NoteCard = ({ note }: { note: Note }) => {
  const { deleteNote, updateNote } = useNoteStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const { user } = useAuthStore();

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const handleDelete = async () => {
      try {
        await deleteNote(note.id!);
        toast.success("Note deleted successfully.");
      } catch (error) {
        toast.error("Failed to delete note.");
      }
  };

  const handleUpdate = async () => {
    if (!editText.trim()) {
      toast.error("Note cannot be empty.");
      return;
    }
    try {
      await updateNote(note.id!, { text: editText, created_by: user?.id });
      toast.success("Note updated successfully.");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update note.");
    }
  };

  return (
    <Card className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="mt-1 flex-shrink-0">
            {getInitials(note?.partner?.name ?? "")}
          </Avatar>
          <div className="flex-1">
            {isEditing ? (
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full text-sm"
                autoFocus
              />
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {note.text}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Created at{" "}
              {note.created_at
                ? format(new Date(note.created_at), "dd MMM yyyy, p")
                : "..."}{" "}
              by <span className="font-medium">{note.partner?.name ?? ""}</span>
            </p>
            {isEditing && (
              <div className="flex gap-2 mt-3">
                                <Button size="sm" color="primary" onPress={handleUpdate} className="text-white">
                  Update
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
        {!isEditing && (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" className="-mr-2">
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Note Actions">
              <DropdownItem key="edit" onPress={() => setIsEditing(true)}>
                Edit
              </DropdownItem>
              <DropdownItem key="delete" color="danger" onPress={handleDelete}>
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </div>
    </Card>
  );
};

export default function NotesTab({ leadId }: { leadId: string }) {
  const { notes, loading, fetchNotesByLeadId, addNote } = useNoteStore();
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (leadId) {
      fetchNotesByLeadId(leadId);
    }
  }, [leadId, fetchNotesByLeadId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addNote({
        text: newNote,
        lead_id: leadId,
        created_by: user.id,
      });
      setNewNote("");
      toast.success("Note added successfully!");
      fetchNotesByLeadId(leadId);
    } catch (error) {
      toast.error("Failed to add note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
      <div className="flex flex-col h-full">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner label="Loading notes..." />
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center p-8 h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-center text-gray-500">
              No notes yet. <br /> Add one to start the conversation.
            </p>
          </div>
        )}
      </div>

      <div>
        <Card as="form" onSubmit={handleAddNote} className="p-6 bg-white shadow-sm rounded-lg border border-gray-200 sticky top-4">
          <h3 className="text-base font-semibold text-gray-800 mb-2">
            Add a new note
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Your note will be saved and visible to other team members.
          </p>
          <Textarea
            placeholder="Save your conversations with your students here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            minRows={6}
            className="text-sm"
          />
          <div className="flex justify-end mt-4 items-center">
            <p className="text-xs text-gray-400 mr-4">Press Enter to add a new line</p>
            <Button
              type="submit"
              color="primary"
              isDisabled={!newNote.trim() || isSubmitting}
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Adding Note..." : "Add Note"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};