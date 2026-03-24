import { TimelineEvent } from "@/lib/utils";
import { Timeline, useTimelineStore } from "@/stores/useTimelineStore";
import { Spinner } from "@heroui/react";
import { History } from "lucide-react";
import { useEffect, useMemo } from "react";
import { buildLeadDetailsDiffList, eventColors, eventIcons } from "../leads-components/timeLineTab";
import { format } from "date-fns";

export const TimelineItem = ({
    event,
    isLast,
}: {
    event: Timeline;
    isLast: boolean;
}) => {
    const Icon = eventIcons[event.event_type as TimelineEvent] || History;
    const colors = eventColors[event.event_type] || eventColors.DEFAULT;

    const oldNoteText =
        event.event_type === TimelineEvent.LEAD_NOTE_UPDATED
            ? event.old_state
            : null;
    const newNoteText =
        event.event_type === TimelineEvent.LEAD_NOTE_ADDED ||
            event.event_type === TimelineEvent.LEAD_NOTE_UPDATED
            ? event.new_state
            : null;
    const deletedNoteText =
        event.event_type === TimelineEvent.LEAD_NOTE_DELETED
            ? event.old_state
            : null;

    return (
        <div className="relative flex items-start gap-4 pb-8">
            {!isLast && (
                <div className="absolute left-5 top-7 -bottom-2 w-0.5 bg-gray-200" />
            )}

            <div className="relative z-10 mt-1 hover:scale-110 transition-transform duration-200">
                <div
                    className={`${colors.bg} flex items-center justify-center h-10 w-10 rounded-xl shadow-sm hover:shadow-md transition-shadow`}
                >
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
            </div>

            <div className="flex-1">
                <p className="text-sm text-gray-700">
                    <strong className="font-semibold text-gray-900">
                        {event.partner?.name ?? "System"}
                    </strong>{" "}
                    {renderEventAction(event)}
                </p>

                {(newNoteText || oldNoteText || deletedNoteText) && (
                    <div className="mt-2 text-sm text-gray-600 border-l-4 bg-gray-50/50 p-3 rounded-r-md">
                        {oldNoteText && (
                            <s className="text-gray-400 italic">{oldNoteText}</s>
                        )}
                        {newNoteText && (
                            <p className={`italic ${oldNoteText ? "mt-1" : ""}`}>
                                {newNoteText}
                            </p>
                        )}
                        {deletedNoteText && (
                            <s className="italic">{deletedNoteText}</s>
                        )}
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

export const renderEventAction = (event: Timeline) => {
    const { event_type, old_state, new_state } = event;

    const Field = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
        <span className={`font-bold text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-md transition-colors hover:bg-indigo-100 ${className}`}>
            {children}
        </span>
    );
    const OldValue = ({ children }: { children: React.ReactNode }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 mx-1">
            {children}
        </span>
    );
    const NewValue = ({ children }: { children: React.ReactNode }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 mx-1">
            {children}
        </span>
    );
    const Quote = ({ children }: { children: React.ReactNode }) => (
        <span className="font-semibold text-sky-800 bg-sky-50 px-1 rounded italic underline decoration-sky-200">
            "{children}"
        </span>
    );

    switch (event_type) {
        case TimelineEvent.LEAD_CREATED:
            return <>created lead <Field>{event.lead?.name || "Lead"}</Field>.</>;

        case TimelineEvent.LEAD_NAME_CHANGED:
            return (
                <>
                    changed <Field>Lead Name</Field> for <Field>{event.lead?.name || "Lead"}</Field> from <OldValue>{old_state}</OldValue> to{" "}
                    <NewValue>{new_state}</NewValue>.
                </>
            );

        case TimelineEvent.LEAD_PHONE_CHANGED:
            return (
                <>
                    changed <Field>Lead Phone</Field> for <Field>{event.lead?.name || "Lead"}</Field> from <OldValue>{old_state}</OldValue> to{" "}
                    <NewValue>{new_state}</NewValue>.
                </>
            );

        case TimelineEvent.LEAD_EMAIL_CHANGED:
            return (
                <>
                    changed <Field>Lead Email</Field> for <Field>{event.lead?.name || "Lead"}</Field> from <OldValue>{old_state}</OldValue> to{" "}
                    <NewValue>{new_state}</NewValue>.
                </>
            );

        case TimelineEvent.LEAD_PURPOSE_CHANGED: {
            const detailChanges = buildLeadDetailsDiffList(old_state, new_state);

            if (detailChanges.length === 1) {
                const change = detailChanges[0];
                return (
                    <>
                        updated <Field>{change.field}</Field> for <Field>{event.lead?.name || "Lead"}</Field> from <OldValue>{change.oldValue}</OldValue> to{" "}
                        <NewValue>{change.newValue}</NewValue>.
                    </>
                );
            }

            if (detailChanges.length > 1) {
                return (
                    <>
                        updated <Field>Lead Details</Field> for <Field>{event.lead?.name || "Lead"}</Field>:
                        {detailChanges.map((change, index) => (
                            <span key={`${change.field}-${index}`}>
                                {index > 0 ? "; " : " "}
                                <Field>{change.field}</Field> from <OldValue>{change.oldValue}</OldValue> to{" "}
                                <NewValue>{change.newValue}</NewValue>
                            </span>
                        ))}
                        .
                    </>
                );
            }

            return (
                <>
                    updated <Field>Lead Details</Field> for <Field>{event.lead?.name || "Lead"}</Field> from <OldValue>{old_state || "-"}</OldValue> to{" "}
                    <NewValue>{new_state || "-"}</NewValue>.
                </>
            );
        }

        case TimelineEvent.LEAD_STATUS_CHANGED:
            return (
                <>
                    changed <Field>Status</Field> for <Field>{event.lead?.name || "Lead"}</Field> from <OldValue>{old_state}</OldValue> to{" "}
                    <NewValue>{new_state}</NewValue>.
                </>
            );

        case TimelineEvent.LEAD_DEPARTMENT_CHANGED:
            return (
                <>
                    moved <Field>{event.lead?.name || "Lead"}</Field> from <OldValue>{old_state || '-'}</OldValue> to{" "}
                    <NewValue>{new_state || '-'}</NewValue>.
                </>
            );

        case TimelineEvent.LEAD_OWNER_CHANGED:
            return <>reassigned lead <Field>{event.lead?.name || "Lead"}</Field>.</>;

        case TimelineEvent.LEAD_NOTE_ADDED:
            return <>added a note for <Field>{event.lead?.name || "Lead"}</Field>.</>;

        case TimelineEvent.LEAD_NOTE_UPDATED:
            return <>updated a note for <Field>{event.lead?.name || "Lead"}</Field>.</>;

        case TimelineEvent.LEAD_NOTE_DELETED:
            return <>deleted a note for <Field>{event.lead?.name || "Lead"}</Field>.</>;

        case TimelineEvent.LEAD_FOLLOWUP_ADDED:
            return (
                <>
                    created follow up <Quote>{new_state}</Quote> for <Field>{event.lead?.name || "Lead"}</Field>.
                </>
            );

        case TimelineEvent.LEAD_FOLLOWUP_UPDATED:
            return (
                <>
                    updated follow up for <Field>{event.lead?.name || "Lead"}</Field> from <Quote>{old_state}</Quote> to <Quote>{new_state}</Quote>.
                </>
            );

        case TimelineEvent.LEAD_FOLLOWUP_DELETED:
            return (
                <>
                    deleted follow up <Quote>{old_state}</Quote> for <Field>{event.lead?.name || "Lead"}</Field>.
                </>
            );

        case TimelineEvent.LEAD_FOLLOWUP_COMPLETED:
            return (
                <>
                    completed follow up <Quote>{new_state}</Quote> for <Field>{event.lead?.name || "Lead"}</Field>.
                </>
            );

        case TimelineEvent.LEAD_FOLLOWUP_DATE_EXTENDED:
            return (
                <>
                    extended due date for <Field>{event.lead?.name || "Lead"}</Field> from{" "}
                    <OldValue>{old_state ? format(new Date(old_state), "dd MMM") : "N/A"}</OldValue>{" "}
                    to{" "}
                    <NewValue>{new_state ? format(new Date(new_state), "dd MMM") : "N/A"}</NewValue>.
                </>
            );

        case TimelineEvent.LEAD_FOLLOWUP_COMMENT_ADDED:
            return (
                <>
                    added a comment for <Field>{event.lead?.name || "Lead"}</Field>: <Quote>{new_state}</Quote>
                </>
            );

        case TimelineEvent.LEAD_FOLLOWUP_COMMENT_DELETED:
            return <>deleted all comments from a follow up for <Field>{event.lead?.name || "Lead"}</Field>.</>;

        case TimelineEvent.OFFLINE_PAYMENT_ADDED:
            return <>recorded an offline payment of <NewValue>{new_state}</NewValue> for <Field>{event.lead?.name || "Lead"}</Field>.</>;

        case TimelineEvent.OFFLINE_PAYMENT_UPDATED:
            return <>updated an offline payment for <Field>{event.lead?.name || "Lead"}</Field> from <OldValue>{old_state}</OldValue> to <NewValue>{new_state}</NewValue>.</>;

        case TimelineEvent.OFFLINE_PAYMENT_DELETED:
            return <>deleted an offline payment for <Field>{event.lead?.name || "Lead"}</Field> of <OldValue>{old_state}</OldValue>.</>;

        default:
            return <>{event_type.replace(/_/g, " ").toLowerCase()}.</>;
    }
};



export default function DashboardTimeline({ leadIds }: { leadIds: string[] }) {
    const { fetchAllTimelines, timelineByLead, loading } = useTimelineStore();

    const ids = useMemo(() => [...new Set(leadIds)].filter(Boolean), [leadIds]);

    useEffect(() => {
        if (ids.length) fetchAllTimelines(ids);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(ids)]);

    const feed = useMemo(() => {
        const rows = ids.flatMap((id) => timelineByLead?.[id] ?? []);
        return rows.sort(
            (a: any, b: any) =>
                (b.created_at ? +new Date(b.created_at) : 0) -
                (a.created_at ? +new Date(a.created_at) : 0)
        );
    }, [ids, timelineByLead]);
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner label="Loading timeline..." />
            </div>
        );
    }

    if (feed.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 mt-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                    <History className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No Activity Yet</h3>
                    <p className="mt-1 text-sm text-gray-500">All lead activities and changes will be shown here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full max-h-[400px]">
             <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <History className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Timeline</h2>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Live Feed
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto hover-scrollbar p-6 space-y-1">
                {feed.slice(0, 10).map((event, index) => (
                    <TimelineItem
                        key={event.id}
                        event={event}
                        isLast={index === Math.min(feed.length, 10) - 1}
                    />
                ))}
            </div>
        </div>
    );
}