import { TimelineEvent } from "@/lib/utils";
import { Timeline, useTimelineStore } from "@/stores/useTimelineStore";
import { Spinner } from "@heroui/react";
import { History } from "lucide-react";
import { useEffect, useMemo } from "react";
import { eventColors, eventIcons } from "../leads-components/timeLineTab";
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

            <div className="relative z-10 mt-1">
                <div
                    className={`ring-2 ring-white ${colors.bg} flex items-center justify-center h-10 w-10 rounded-full shadow-sm`}
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

    const Field = ({ children }: { children: React.ReactNode }) => (
        <strong className="font-semibold text-gray-800">{children}</strong>
    );
    const OldValue = ({ children }: { children: React.ReactNode }) => (
        <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-md text-xs font-mono">
            {children}
        </span>
    );
    const NewValue = ({ children }: { children: React.ReactNode }) => (
        <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-md text-xs font-mono">
            {children}
        </span>
    );
    const Quote = ({ children }: { children: React.ReactNode }) => (
        <strong className="font-semibold text-sky-700">"{children}"</strong>
    );

    switch (event_type) {
        case TimelineEvent.LEAD_CREATED:
            return <>created a lead.</>;

        case TimelineEvent.LEAD_NAME_CHANGED:
            return (
                <>
                    changed <Field>Lead Name</Field> from <OldValue>{old_state}</OldValue> to{" "}
                    <NewValue>{new_state}</NewValue>.
                </>
            );

        case TimelineEvent.LEAD_PHONE_CHANGED:
            return (
                <>
                    changed <Field>Lead Phone</Field> from <OldValue>{old_state}</OldValue> to{" "}
                    <NewValue>{new_state}</NewValue>.
                </>
            );

        case TimelineEvent.LEAD_EMAIL_CHANGED:
            return (
                <>
                    changed <Field>Lead Email</Field> from <OldValue>{old_state}</OldValue> to{" "}
                    <NewValue>{new_state}</NewValue>.
                </>
            );

        case TimelineEvent.LEAD_STATUS_CHANGED:
            return (
                <>
                    changed <Field>Status</Field> from <OldValue>{old_state}</OldValue> to{" "}
                    <NewValue>{new_state}</NewValue>.
                </>
            );

        case TimelineEvent.LEAD_OWNER_CHANGED:
            return <>reassigned the lead.</>;

        case TimelineEvent.LEAD_NOTE_ADDED:
            return <>added a note.</>;

        case TimelineEvent.LEAD_NOTE_UPDATED:
            return <>updated a note.</>;

        case TimelineEvent.LEAD_NOTE_DELETED:
            return <>deleted a note.</>;

        case TimelineEvent.LEAD_FOLLOWUP_ADDED:
            return (
                <>
                    created follow up <Quote>{new_state}</Quote>.
                </>
            );

        case TimelineEvent.LEAD_FOLLOWUP_UPDATED:
            return (
                <>
                    updated follow up from <Quote>{old_state}</Quote> to <Quote>{new_state}</Quote>.
                </>
            );

        case TimelineEvent.LEAD_FOLLOWUP_DELETED:
            return (
                <>
                    deleted follow up <Quote>{old_state}</Quote>.
                </>
            );

        case TimelineEvent.LEAD_FOLLOWUP_COMPLETED:
            return (
                <>
                    completed the follow up <Quote>{new_state}</Quote>.
                </>
            );

        case TimelineEvent.LEAD_FOLLOWUP_DATE_EXTENDED:
            return (
                <>
                    extended the due date from{" "}
                    <OldValue>{old_state ? format(new Date(old_state), "dd MMM") : "N/A"}</OldValue>{" "}
                    to{" "}
                    <NewValue>{new_state ? format(new Date(new_state), "dd MMM") : "N/A"}</NewValue>.
                </>
            );

        case TimelineEvent.LEAD_FOLLOWUP_COMMENT_ADDED:
            return (
                <>
                    added a comment: <Quote>{new_state}</Quote>
                </>
            );

        case TimelineEvent.LEAD_FOLLOWUP_COMMENT_DELETED:
            return <>deleted all comments from a follow up.</>;

        case TimelineEvent.OFFLINE_PAYMENT_ADDED:
            return <>recorded an offline payment of <NewValue>{new_state}</NewValue>.</>;

        case TimelineEvent.OFFLINE_PAYMENT_UPDATED:
            return <>updated an offline payment from <OldValue>{old_state}</OldValue> to <NewValue>{new_state}</NewValue>.</>;

        case TimelineEvent.OFFLINE_PAYMENT_DELETED:
            return <>deleted an offline payment of <OldValue>{old_state}</OldValue>.</>;

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
        <div className="bg-white px-5 rounded-xl shadow-xl max-h-[370px] overflow-y-scroll relative">
            <h2 className="text-xl mb-6 text-gray-900 sticky top-0 bg-white z-9999 py-2">Timeline</h2>
            <div>
                {feed.map((event, index) => (
                    <TimelineItem
                        key={event.id}
                        event={event}
                        isLast={index === feed.length - 1}
                    />
                ))}
            </div>
        </div>
    );
}