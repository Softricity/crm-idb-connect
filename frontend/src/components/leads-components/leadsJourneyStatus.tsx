import { useEffect, useMemo, useState } from "react";
import { Select, SelectItem } from "@heroui/react";
import { LeadsAPI } from "@/lib/api";

interface TimelineEvent {
    event_type: string;
    old_state: string | null;
    new_state: string | null;
    created_at: string;
}

interface JourneyStageConfig {
    key: string;
    label: string;
}

const JOURNEY_STAGES: JourneyStageConfig[] = [
    { key: "ONLINE_INQUIRY", label: "Online Inquiry" },
    { key: "OFFICE_VISIT", label: "Visited Office" },
    { key: "ACADEMIC_DOCS_SUBMITTED", label: "Academic Document Submitted" },
    { key: "APPLICATION_PROCESSED", label: "Application Processed" },
    { key: "APPLICATION_SUBMITTED_TO_UNIVERSITY", label: "Application Submitted to University" },
    { key: "UNIVERSITY_ACCEPTANCE_RECEIVED", label: "University Acceptance Letter Received" },
    { key: "PAYMENT_DONE", label: "Payment Done" },
    { key: "VISA_DOCS_PREPARED", label: "Documentation For Visa Process Done" },
    { key: "FORWARDED_TO_COMPLIANCE", label: "Forwarded to Compliance for Visa Application" },
    { key: "VISA_DECISION", label: "Visa Granted/Rejected/Supplement Requested" },
    { key: "REFUND_PROCESSED", label: "Refund Processed" },
    { key: "POST_COUNSELLING_DONE", label: "Post Counselling Done" },
];

// stages a lead may legitimately skip depending on path (e.g. no OFFICE_VISIT for pure online leads,
// no REFUND_PROCESSED unless visa was rejected) — treated as "not applicable" rather than "pending"
const OPTIONAL_STAGES = new Set(["OFFICE_VISIT", "REFUND_PROCESSED"]);

export default function StudentJourneyTimeline({
    leadId,
    onChange,
}: {
    leadId: string;
    onChange: (stageKey: string, newState: string) => Promise<void> | void;
}) {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);       // initial mount only
    const [updating, setUpdating] = useState(false);     // per-click refetch

    const fetchJourneyEvents = async () => {
        try {
            const response = await LeadsAPI.fetchTimeline(leadId);
            const journeyKeys = new Set(JOURNEY_STAGES.map((s) => s.key));
            const filtered = Array.isArray(response)
                ? response.filter((e: TimelineEvent) => journeyKeys.has(e.event_type))
                : [];
            setEvents(filtered);
        } catch (error: any) {
            console.error("Failed to fetch journey timeline for lead:", error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJourneyEvents();
    }, [leadId]);

    // latest new_state per stage — events come back created_at desc from API, so first match wins;
    // if your API doesn't guarantee order, sort by created_at desc before reducing
    const stageState = useMemo(() => {
        const map: Record<string, string> = {};
        for (const e of events) {
            if (!map[e.event_type] && e.new_state) {
                map[e.event_type] = e.new_state;
            }
        }
        return map;
    }, [events]);

    const isStageComplete = (stageKey: string) => {
        const state = stageState[stageKey];
        if (!state) return false;
        return state === "DONE" || state === "GRANTED" || state === "REJECTED" || state === "SUPPLEMENT_REQUESTED";
    };

    // furthest completed stage index, skipping over optional stages that have no event yet
    const latestEvent = useMemo(() => {
        if (!events.length) return null;
        return [...events].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
    }, [events]);

    const currentIndex = useMemo(() => {
        if (!latestEvent) return -1;
        return JOURNEY_STAGES.findIndex((s) => s.key === latestEvent.event_type);
    }, [latestEvent]);

    const currentStage = currentIndex >= 0 ? JOURNEY_STAGES[currentIndex] : null;

    const nextIncompleteStage = JOURNEY_STAGES.find((s) => !isStageComplete(s.key));

    const handleStageUpdate = async (stageKey: string) => {
        const stage = JOURNEY_STAGES.find((s) => s.key === stageKey);
        if (!stage) return;
        const newState = stageKey === "VISA_DECISION" ? "GRANTED" : "DONE";
        setUpdating(true);
        try {
            await onChange(stageKey, newState);
            await fetchJourneyEvents();
        } finally {
            setUpdating(false);
        }
    };
    if (loading) {
        return <div className="p-6 bg-white rounded-lg shadow text-sm text-gray-400">Loading journey…</div>;
    }


    return (

        <div className="w-full p-6 bg-white rounded-lg shadow flex items-center">
            <div className="flex-1 overflow-x-auto">
                <div className="flex items-start relative" style={{ minWidth: `${JOURNEY_STAGES.length * 130}px` }}>
                    {JOURNEY_STAGES.map((stage, index) => {
                        const complete = isStageComplete(stage.key);
                        const isActive = index <= currentIndex;
                        const isNextActive = index + 1 <= currentIndex;
                        const state = stageState[stage.key];
                        const isRejected = stage.key === "VISA_DECISION" && state === "REJECTED";
                        const isOptionalSkipped = OPTIONAL_STAGES.has(stage.key) && !complete && index < currentIndex;

                        let circleClasses = "bg-gray-200 text-gray-600";
                        let labelClasses = "text-gray-500";
                        let lineClasses = "border-gray-300";

                        if (isActive && !isOptionalSkipped) {
                            circleClasses = isRejected ? "bg-red-500 text-white" : "bg-green-500 text-white";
                            labelClasses = isRejected ? "text-red-600" : "text-green-600";
                        } else if (isOptionalSkipped) {
                            circleClasses = "bg-gray-100 text-gray-400 border border-dashed border-gray-300";
                            labelClasses = "text-gray-400";
                        }

                        if (isNextActive) {
                            lineClasses = isRejected ? "border-red-500" : "border-green-500";
                        }

                        return (
                            <div key={stage.key} className="flex-none w-[130px] flex flex-col items-center relative">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-semibold z-10 ${circleClasses}`}>
                                    {index + 1}
                                </div>
                                <p className={`mt-2 text-xs font-medium text-center px-1 ${labelClasses}`}>
                                    {stage.key === "VISA_DECISION" && state ? state.replace("_", " ") : stage.label}
                                </p>
                                {index < JOURNEY_STAGES.length - 1 && (
                                    <div className={`absolute top-5 left-1/2 w-full h-0.5 border-t-2 border-dotted ${lineClasses}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="ml-8 shrink-0">
                <Select
                    label="Mark Stage Complete"
                    placeholder="Select next stage"
                    selectedKeys={currentStage ? new Set([currentStage.key]) : new Set()}
                    onSelectionChange={(keys) => handleStageUpdate(Array.from(keys)[0] as string)}
                    isDisabled={updating}
                    className="w-[220px]"
                >
                    {JOURNEY_STAGES.map((stage) => (
                        <SelectItem key={stage.key}>{stage.label}</SelectItem>
                    ))}
                </Select>
            </div>
        </div>

    );
}