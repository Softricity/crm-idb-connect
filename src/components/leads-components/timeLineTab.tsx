"use client";

import React, { useEffect } from "react";
import { format } from "date-fns";
import { useTimelineStore, Timeline } from "@/stores/useTimelineStore";
import { TimelineEvent } from "@/lib/utils";
import { Avatar, Spinner } from "@heroui/react";
import {
  UserPlus,
  Edit3,
  Mail,
  Phone,
  Briefcase,
  UserCheck,
  Flag,
  FileText,
  Trash2,
  Plus,
  Calendar,
  CheckCircle,
  MessageSquare,
  History,
} from "lucide-react";

// 1. Color scheme for different event types
const eventColors: { [key: string]: { bg: string; icon: string } } = {
  // Additions -> Green
  [TimelineEvent.LEAD_CREATED]: { bg: "bg-green-50", icon: "text-green-600" },
  [TimelineEvent.LEAD_NOTE_ADDED]: { bg: "bg-green-50", icon: "text-green-600" },
  [TimelineEvent.LEAD_FOLLOWUP_ADDED]: { bg: "bg-green-50", icon: "text-green-600" },
  [TimelineEvent.LEAD_FOLLOWUP_COMMENT_ADDED]: { bg: "bg-green-50", icon: "text-green-600" },
  // Updates -> Blue / Indigo / Cyan
  [TimelineEvent.LEAD_NAME_CHANGED]: { bg: "bg-blue-50", icon: "text-blue-600" },
  [TimelineEvent.LEAD_EMAIL_CHANGED]: { bg: "bg-blue-50", icon: "text-blue-600" },
  [TimelineEvent.LEAD_PHONE_CHANGED]: { bg: "bg-blue-50", icon: "text-blue-600" },
  [TimelineEvent.LEAD_NOTE_UPDATED]: { bg: "bg-blue-50", icon: "text-blue-600" },
  [TimelineEvent.LEAD_FOLLOWUP_UPDATED]: { bg: "bg-blue-50", icon: "text-blue-600" },
  [TimelineEvent.LEAD_STATUS_CHANGED]: { bg: "bg-indigo-50", icon: "text-indigo-600" },
  [TimelineEvent.LEAD_FOLLOWUP_DATE_EXTENDED]: { bg: "bg-cyan-50", icon: "text-cyan-600" },
  // Completion -> Purple
  [TimelineEvent.LEAD_FOLLOWUP_COMPLETED]: { bg: "bg-purple-50", icon: "text-purple-600" },
  // Reassignment -> Yellow
  [TimelineEvent.LEAD_OWNER_CHANGED]: { bg: "bg-yellow-50", icon: "text-yellow-600" },
  // Deletions -> Red
  [TimelineEvent.LEAD_NOTE_DELETED]: { bg: "bg-red-50", icon: "text-red-600" },
  [TimelineEvent.LEAD_FOLLOWUP_DELETED]: { bg: "bg-red-50", icon: "text-red-600" },
  [TimelineEvent.LEAD_FOLLOWUP_COMMENT_DELETED]: { bg: "bg-red-50", icon: "text-red-600" },
  // Default
  DEFAULT: { bg: "bg-gray-100", icon: "text-gray-600" },
};

// 2. Icon mapping for different event types
const eventIcons: { [key in TimelineEvent]?: React.ElementType } = {
  [TimelineEvent.LEAD_CREATED]: UserPlus,
  [TimelineEvent.LEAD_NAME_CHANGED]: Edit3,
  [TimelineEvent.LEAD_EMAIL_CHANGED]: Mail,
  [TimelineEvent.LEAD_PHONE_CHANGED]: Phone,
  [TimelineEvent.LEAD_PURPOSE_CHANGED]: Briefcase,
  [TimelineEvent.LEAD_OWNER_CHANGED]: UserCheck,
  [TimelineEvent.LEAD_STATUS_CHANGED]: Flag,
  [TimelineEvent.LEAD_NOTE_ADDED]: FileText,
  [TimelineEvent.LEAD_NOTE_DELETED]: Trash2,
  [TimelineEvent.LEAD_NOTE_UPDATED]: Edit3,
  [TimelineEvent.LEAD_FOLLOWUP_ADDED]: Plus,
  [TimelineEvent.LEAD_FOLLOWUP_DELETED]: Trash2,
  [TimelineEvent.LEAD_FOLLOWUP_UPDATED]: Edit3,
  [TimelineEvent.LEAD_FOLLOWUP_DATE_EXTENDED]: Calendar,
  [TimelineEvent.LEAD_FOLLOWUP_COMPLETED]: CheckCircle,
  [TimelineEvent.LEAD_FOLLOWUP_COMMENT_ADDED]: MessageSquare,
  [TimelineEvent.LEAD_FOLLOWUP_COMMENT_DELETED]: Trash2,
};

// 3. Function to render the human-readable action string
const renderEventAction = (event: Timeline, leadName: string) => {
  const { event_type, old_state, new_state } = event;

  const Field = ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-gray-800">{children}</strong>;
  const OldValue = ({ children }: { children: React.ReactNode }) => <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-md text-xs font-mono">{children}</span>;
  const NewValue = ({ children }: { children: React.ReactNode }) => <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-md text-xs font-mono">{children}</span>;
  const Quote = ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-sky-700">"{children}"</strong>;

  switch (event_type) {
    case TimelineEvent.LEAD_CREATED:
      return <>created this lead.</>;
    case TimelineEvent.LEAD_NAME_CHANGED:
      return <>changed <Field>Lead Name</Field> from <OldValue>{old_state}</OldValue> to <NewValue>{new_state}</NewValue>.</>;
    case TimelineEvent.LEAD_PHONE_CHANGED:
      return <>changed <Field>Lead Phone</Field> from <OldValue>{old_state}</OldValue> to <NewValue>{new_state}</NewValue>.</>;
    case TimelineEvent.LEAD_EMAIL_CHANGED:
      return <>changed <Field>Lead Email</Field> from <OldValue>{old_state}</OldValue> to <NewValue>{new_state}</NewValue>.</>;
    case TimelineEvent.LEAD_STATUS_CHANGED:
      return <>changed <Field>Status</Field> from <OldValue>{old_state}</OldValue> to <NewValue>{new_state}</NewValue>.</>;
    case TimelineEvent.LEAD_OWNER_CHANGED:
      return <>reassigned the lead.</>;
    case TimelineEvent.LEAD_NOTE_ADDED:
      return <>added a note for <Field>{leadName}</Field>.</>;
    case TimelineEvent.LEAD_NOTE_UPDATED:
      return <>updated a note for <Field>{leadName}</Field>.</>;
    case TimelineEvent.LEAD_NOTE_DELETED:
      return <>deleted a note for <Field>{leadName}</Field>.</>;
    case TimelineEvent.LEAD_FOLLOWUP_ADDED:
      return <>created follow up <Quote>{new_state}</Quote> for lead <Field>{leadName}</Field>.</>;
    case TimelineEvent.LEAD_FOLLOWUP_UPDATED:
      return <>updated follow up from <Quote>{old_state}</Quote> to <Quote>{new_state}</Quote>.</>;
    case TimelineEvent.LEAD_FOLLOWUP_DELETED:
      return <>deleted follow up <Quote>{old_state}</Quote>.</>;
    case TimelineEvent.LEAD_FOLLOWUP_COMPLETED:
      return <>completed the follow up <Quote>{new_state}</Quote>.</>;
    case TimelineEvent.LEAD_FOLLOWUP_DATE_EXTENDED:
      return <>extended the due date from <OldValue>{old_state ? format(new Date(old_state), "dd MMM") : "N/A"}</OldValue> to <NewValue>{new_state ? format(new Date(new_state), "dd MMM") : "N/A"}</NewValue>.</>;
    case TimelineEvent.LEAD_FOLLOWUP_COMMENT_ADDED:
      return <>added a comment: <Quote>{new_state}</Quote></>;
    case TimelineEvent.LEAD_FOLLOWUP_COMMENT_DELETED:
      return <>deleted all comments from a follow up.</>;
    default:
      return <>{event_type.replace(/_/g, " ").toLowerCase()}.</>;
  }
};

// 4. Sub-component for a single timeline item
const TimelineItem = ({ event, isLast, leadName }: { event: Timeline; isLast: boolean; leadName: string; }) => {
  const Icon = eventIcons[event.event_type as TimelineEvent] || History;
  const colors = eventColors[event.event_type] || eventColors.DEFAULT;

  const oldNoteText = event.event_type === TimelineEvent.LEAD_NOTE_UPDATED ? event.old_state : null;
  const newNoteText = event.event_type === TimelineEvent.LEAD_NOTE_ADDED || event.event_type === TimelineEvent.LEAD_NOTE_UPDATED ? event.new_state : null;
  const deletedNoteText = event.event_type === TimelineEvent.LEAD_NOTE_DELETED ? event.old_state : null;

  return (
    <div className="relative flex items-start gap-4 pb-8">
      {!isLast && <div className="absolute left-5 top-7 -bottom-2 w-0.5 bg-gray-200" />}
      
      <div className="relative z-10 mt-1">
        <div className={`ring-2 ring-white ${colors.bg} flex items-center justify-center h-10 w-10 rounded-full shadow-sm`}>
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
      </div>

      <div className="flex-1">
        <p className="text-sm text-gray-700">
          <strong className="font-semibold text-gray-900">{event.partner?.name ?? "System"}</strong>
          {' '}
          {renderEventAction(event, leadName)}
        </p>

        {(newNoteText || oldNoteText || deletedNoteText) && (
            <div className="mt-2 text-sm text-gray-600 border-l-4 bg-gray-50/50 p-3 rounded-r-md">
                {oldNoteText && <s className="text-gray-400 italic">{oldNoteText}</s>}
                {newNoteText && <p className={`italic ${oldNoteText ? 'mt-1' : ''}`}>{newNoteText}</p>}
                {deletedNoteText && <s className="italic">{deletedNoteText}</s>}
            </div>
        )}

        <p className="mt-1 text-xs text-gray-500">
          {event.created_at
            ? format(new Date(event.created_at), "dd MMM yyyy HH:mm")
            : "..."}
        </p>
      </div>
    </div>
  );
};

// 5. Main exported component
export default function TimeLineTab({ leadId, leadName }: { leadId: string; leadName: string }) {
  const { timeline, loading, fetchTimelineByLeadId } = useTimelineStore();

  useEffect(() => {
    if (leadId) {
      fetchTimelineByLeadId(leadId);
    }
  }, [leadId, fetchTimelineByLeadId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Loading timeline..." />
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
        <div className="flex items-center justify-center p-8 mt-4 h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No Activity Yet</h3>
                <p className="mt-1 text-sm text-gray-500">All lead activities and changes will be shown here.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="mt-4 bg-white p-5 rounded-xl shadow-sm">
      <h2 className="text-xl mb-6 font-semibold text-gray-900">Timeline for {leadName}</h2>
      <div>
        {timeline.map((event, index) => (
          <TimelineItem
            key={event.id}
            event={event}
            isLast={index === timeline.length - 1}
            leadName={leadName}
          />
        ))}
      </div>
    </div>
  );
}