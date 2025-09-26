"use client";

import React, { useState } from "react";
import { useNoteStore } from "@/stores/useNoteStore";
import { useAuthStore } from "@/stores/useAuthStore";

const NotesTest = () => {
  const {
    notes,
    loading,
    fetchNotesByLeadId,
    addNote,
    updateNote,
    deleteNote,
    clearNotes,
  } = useNoteStore();

  const [leadId, setLeadId] = useState("aa1ec268-46c4-44e9-a614-3a5d76ed5fd7");
  const [text, setText] = useState("");
  const { user } = useAuthStore();

  const handleFetch = async () => {
    if (!leadId) return alert("Enter a Lead ID");
    await fetchNotesByLeadId(leadId);
  };

  const handleAdd = async () => {
    if (!text || !leadId) return alert("Enter text and Lead ID");
    if (!user?.id) return alert("You must be logged in");

    await addNote({
      text,
      lead_id: leadId,
      created_by: "d345065f-cc0f-4234-b00a-8abfab5e8167",
    });
    setText("");
  };

  const handleUpdate = async (id: string) => {
    const newText = prompt("Enter new note text:");
    if (!newText) return;
    await updateNote(id, { text: newText });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Notes Test Component</h2>

      {/* Lead Input */}
      <div className="flex space-x-2">
        <input
          className="border p-2 rounded w-64"
          type="text"
          placeholder="Enter Lead ID"
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
        />
        <button
          onClick={handleFetch}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Fetch Notes
        </button>
        <button
          onClick={clearNotes}
          className="bg-gray-400 text-white px-4 py-2 rounded"
        >
          Clear
        </button>
      </div>

      {/* Add Note */}
      <div className="flex space-x-2">
        <input
          className="border p-2 rounded w-64"
          type="text"
          placeholder="New Note"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Add Note
        </button>
      </div>

      {/* Notes List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-2">
          {notes.length === 0 ? (
            <p>No notes found</p>
          ) : (
            notes.map((note) => (
              <li
                key={note.id}
                className="border p-2 rounded flex justify-between items-center"
              >
                <span>
                  <strong>{note.text}</strong> <br />
                  <small>
                    By: {note.created_by} |{" "}
                    {note.created_at
                      ? new Date(note.created_at).toLocaleString()
                      : "N/A"}
                  </small>
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleUpdate(note.id!)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => deleteNote(note.id!)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default NotesTest;
