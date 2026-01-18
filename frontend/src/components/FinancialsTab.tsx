import React, { useEffect, useState } from 'react';
import { FinancialsAPI } from '@/lib/api'; 
import { Plus, AlertCircle, Trash2 } from 'lucide-react'; // ✅ Imported Trash2
import { format } from 'date-fns';

// --- Types & Constants ---
export enum FinancialStatus {
  PENDING = 'PENDING',
  SENT_TO_UNIVERSITY = 'SENT_TO_UNIVERSITY',
  UNDER_PROCESS = 'UNDER_PROCESS',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
}

export interface FinancialNote {
  id: string;
  stage: FinancialStatus;
  content: string;
  created_at: string;
  partner: {
    name: string;
  };
}

export interface FinancialRecord {
  id: string;
  status: FinancialStatus;
  notes: FinancialNote[];
}

const FINANCIAL_STAGES = [
  { key: FinancialStatus.PENDING, label: 'Financials Pending', step: 1 },
  { key: FinancialStatus.SENT_TO_UNIVERSITY, label: 'Financials Sent to the University', step: 2 },
  { key: FinancialStatus.UNDER_PROCESS, label: 'Financials Under Process with the University', step: 3 },
  { key: FinancialStatus.APPROVED, label: 'Financials Approved', step: 4 },
  { key: FinancialStatus.DECLINED, label: 'Financials Declined', step: 5 },
];

// --- Main Component ---

interface FinancialsTabProps {
  leadId: string;
}

const FinancialsTab: React.FC<FinancialsTabProps> = ({ leadId }) => {
  const [data, setData] = useState<FinancialRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStageForNote, setActiveStageForNote] = useState<FinancialStatus | null>(null);
  const [noteContent, setNoteContent] = useState('');
  
  // Deleting State (to show loading on specific button)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await FinancialsAPI.get(leadId);
      setData(response);
    } catch (err) {
      console.error("Failed to fetch financials", err);
      setError("Failed to load financial data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchFinancials();
  }, [leadId]);

  const handleStatusChange = async (newStatus: FinancialStatus) => {
    try {
      setData((prev) => prev ? { ...prev, status: newStatus } : null);
      await FinancialsAPI.updateStatus(leadId, newStatus);
    } catch (error) {
      console.error("Failed to update status", error);
      fetchFinancials();
    }
  };

  const handleAddNote = async () => {
    if (!activeStageForNote || !noteContent.trim()) return;
    try {
      await FinancialsAPI.addNote(leadId, {
        stage: activeStageForNote,
        content: noteContent
      });
      setIsModalOpen(false);
      setNoteContent('');
      fetchFinancials();
    } catch (error) {
      console.error("Failed to add note", error);
    }
  };

  // ✅ NEW: Handle Delete
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      setDeletingNoteId(noteId);
      await FinancialsAPI.deleteNote(noteId);
      
      // Optimistic UI update: Remove note locally
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          notes: prev.notes.filter(n => n.id !== noteId)
        };
      });
    } catch (error) {
      console.error("Failed to delete note", error);
      alert("Failed to delete note");
    } finally {
      setDeletingNoteId(null);
    }
  };

  const openNoteModal = (stage: FinancialStatus) => {
    setActiveStageForNote(stage);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!data) return <div className="p-6 text-center text-gray-500">No record found.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h2 className="text-lg font-bold text-gray-800">Financial Status</h2>
        <div className="relative">
          <select
            value={data.status || FinancialStatus.PENDING}
            onChange={(e) => handleStatusChange(e.target.value as FinancialStatus)}
            className="appearance-none bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-72"
          >
            {FINANCIAL_STAGES.map((stage) => (
              <option key={stage.key} value={stage.key}>{stage.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6 relative">
        <div className="absolute left-[1.65rem] top-6 bottom-6 w-0.5 bg-gray-200 -z-10 border-l-2 border-dashed border-gray-300"></div>

        {FINANCIAL_STAGES.map((stage) => {
          const stageNotes = data.notes?.filter(n => n.stage === stage.key) || [];
          const isActive = data.status === stage.key;

          return (
            <div key={stage.key} className="flex items-start gap-5 group">
              {/* Step Circle */}
              <div className={`
                flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-2 z-10 transition-colors duration-200
                ${isActive 
                  ? 'border-blue-500 text-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-100' 
                  : 'border-gray-200 text-gray-400 bg-white'
                }
              `}>
                {stage.step}
              </div>

              {/* Card */}
              <div className={`
                flex-grow border rounded-xl p-5 shadow-sm transition-all duration-200
                ${isActive ? 'bg-white border-blue-200 shadow-md' : 'bg-white border-gray-200 hover:shadow-md'}
              `}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                    {stage.label}
                  </h3>
                  <button
                    onClick={() => openNoteModal(stage.key)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors border border-blue-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Note
                  </button>
                </div>

                {/* Notes List */}
                {stageNotes.length > 0 && (
                  <div className="space-y-3 mt-4 border-t pt-3 border-gray-100">
                    {stageNotes.map((note) => (
                      <div key={note.id} className="bg-gray-50 p-3.5 rounded-lg border border-gray-100 text-sm group/note relative">
                        <p className="text-gray-700 leading-relaxed pr-6">{note.content}</p>
                        
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-400 font-medium">
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                            {note.partner?.name || 'Unknown User'}
                          </span>
                          <span>{note.created_at ? format(new Date(note.created_at), 'MMM d, h:mm a') : ''}</span>
                        </div>

                        {/* ✅ Delete Icon (Visible on Hover) */}
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deletingNoteId === note.id}
                          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover/note:opacity-100"
                          title="Delete Note"
                        >
                          {deletingNoteId === note.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal - Same as before */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Note</h3>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your note here..."
              className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAddNote} disabled={!noteContent.trim()} className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg disabled:opacity-50">Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialsTab;