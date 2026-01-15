"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState, useMemo } from "react";
import { generateStudentPanelToken } from "@/utils/token";
import { useParams } from "next/navigation";
import { useLeadStore, Lead } from "@/stores/useLeadStore";
import LeadFormSheet from "@/components/leads-components/createUpdateLead";
import { Button, Tabs, Tab } from "@heroui/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FilePen } from "lucide-react";
import NotesTab from "@/components/leads-components/notesTab";
import StatusTimeline from "@/components/leads-components/leadStatusTimeline";
import FollowUpComponent from "@/components/leads-components/followupTab";
import TimeLineTab from "@/components/leads-components/timeLineTab";
import ApplicantProfilePanel from "@/components/application-components/applicationProfilePanel";
import { useSearchParams } from "next/navigation";
import ApplicationDetailsView from "@/components/application-components/applicationDetailsView";
import PaymentsTab from "@/components/leads-components/paymentsTab";

const FollowUpsTab = () => <div className="p-4 text-gray-700">📌 Follow Ups Component</div>;
const DocumentsTab = () => <div className="p-4 text-gray-700">📂 Documents Component</div>;
const CoursesTab = () => <div className="p-4 text-gray-700">🎓 Courses Component</div>;
const TasksTab = () => <div className="p-4 text-gray-700">✅ Tasks Component</div>;
// const PaymentsTab = () => <div className="p-4 text-gray-700">💳 Payments Component</div>;
const EmailsTab = () => <div className="p-4 text-gray-700">📧 Emails Component</div>;
const FinancialsTab = () => <div className="p-4 text-gray-700">💰 Financials Component</div>;
const WhatsAppTab = () => <div className="p-4 text-gray-700">💬 WhatsApp Component</div>;
const ChatTab = () => <div className="p-4 text-gray-700">💭 Chat Component</div>;

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex justify-between py-2 border-b border-dotted border-gray-200">
        <span className="text-gray-500 text-sm">{label}</span>
        <span
            className={`text-gray-900 font-medium text-sm ${label.toLowerCase() === "email" ? "" : "capitalize"
                }`}
        >
            {value || "-"}
        </span>
    </div>
);

export default function LeadDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get("tab") || "details";
    const { fetchLeadById, updateLead } = useLeadStore();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setSheetOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState(defaultTab);
    const [studentPanelOpen, setStudentPanelOpen] = useState(false);

    const fetchAndSetLead = useCallback(async () => {
        setLoading(true);
        const fetchedLead = await fetchLeadById(id);
        setLead(fetchedLead);
        setLoading(false);
    }, [id, fetchLeadById]);

    useEffect(() => {
        if (id) {
            fetchAndSetLead();
        }
    }, [id, fetchAndSetLead]);

    const handleStatusChange = async (newStatus: string, reason?: string) => {
        if (!lead || !lead.id) return;

        const payload: { status: string; reason?: string } = { status: newStatus };
        if (reason) payload.reason = reason;

        try {
            await updateLead(lead.id, payload);
            setLead((prev) => (prev ? { ...prev, ...payload } : null));
            toast.success("Lead status updated successfully!");
        } catch (error) {
            toast.error("Failed to update lead status.");
        }
    };

    const handleSheetStateChange = (isOpen: boolean) => {
        setSheetOpen(isOpen);
        if (!isOpen) fetchAndSetLead();
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center space-y-4">
                <div className="animate-pulse flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gray-300" />
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4" />
                        <div className="h-4 bg-gray-300 rounded w-1/2" />
                    </div>
                </div>
                <div className="mt-6 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6 animate-pulse space-y-4">
                        <div className="h-4 bg-gray-300 rounded w-5/6" />
                        <div className="h-4 bg-gray-300 rounded w-3/4" />
                        <div className="h-4 bg-gray-300 rounded w-2/3" />
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 animate-pulse space-y-4">
                        <div className="h-4 bg-gray-300 rounded w-4/5" />
                        <div className="h-4 bg-gray-300 rounded w-2/3" />
                        <div className="h-4 bg-gray-300 rounded w-1/2" />
                    </div>
                </div>
                <p className="text-gray-500 text-sm animate-pulse">Fetching lead data...</p>
            </div>
        );
    }

    if (!lead) {
        return <div className="p-8 text-center text-red-500">Lead not found.</div>;
    }

    // Memoize token so it only changes when lead changes
    const studentPanelToken = () => {
        if (!lead) return "";
        console.log("Generating new student panel token for lead:", generateStudentPanelToken({ id: lead.id || "", email: lead.email || "", name: lead.name || "" }));
        return generateStudentPanelToken({ id: lead.id || "", email: lead.email || "", name: lead.name || "" });
    };

    return (
        <>
            <div className="bg-gray-50 p-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow mb-6">
                    <div className="flex items-center gap-4">
                        <img
                            src="https://swiftwebapp.sgp1.digitaloceanspaces.com/images/avatar.png"
                            alt="profile"
                            className="w-16 h-16 rounded-full border"
                        />
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">{lead.name}</h1>
                            <p className="text-blue-600 text-sm">{lead.mobile}</p>
                            <p className="text-sm text-gray-500">{lead.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm">
                            <p className="text-gray-500">Lead Owner</p>
                            <p className="text-blue-600 font-medium">
                                {lead.partners_leads_assigned_toTopartners?.name || "Unassigned"}
                            </p>
                        </div>
                        <Button
                            onPress={() => setSheetOpen(true)}
                            color="primary"
                            variant="flat"
                            startContent={<FilePen className="h-4 w-4" />}
                        >
                            Update Details
                        </Button>
                        <Button
                            onPress={() => setStudentPanelOpen(true)}
                            color="secondary"
                            variant="bordered"
                        >
                            Open Student Panel
                        </Button>
                        <Dialog open={studentPanelOpen} onOpenChange={setStudentPanelOpen}>
                            <DialogContent className="min-w-7xl w-full h-[80vh] p-0 flex flex-col">
                                <DialogHeader className="p-4 border-b">
                                    <DialogTitle>Student Panel</DialogTitle>
                                    <DialogClose className="absolute right-4 top-4" />
                                </DialogHeader>
                                <iframe
                                    src={`https://student.idbconnect.global/login?token=${encodeURIComponent(studentPanelToken())}`}
                                    title="Student Panel"
                                    className="flex-1 w-full h-full border-0"
                                    allowFullScreen
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                <StatusTimeline
                    currentStatus={lead.status || "new"}
                    onChange={handleStatusChange}
                />
                <Tabs 
                    aria-label="Lead Tabs" 
                    variant="underlined" 
                    className="mt-6" 
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => setSelectedTab(key as string)}
                >
                    <Tab key="details" title="Details">
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Personal & Lead Details
                                </h3>
                                <InfoRow label="Full Name" value={lead.name} />
                                <InfoRow label="Mobile" value={lead.mobile} />
                                <InfoRow label="Email" value={lead.email} />
                                <InfoRow label="Lead Status" value={lead.status} />
                                {(lead.status === "cold" || lead.status === "rejected") && (
                                    <InfoRow label="Reason for Status" value={lead.reason} />
                                )}
                                <InfoRow label="Lead Type" value={lead.type} />
                                <InfoRow label="Lead Prefered Course" value={lead.preferred_course} />
                                <InfoRow label="Preferred Country" value={lead.preferred_country} />
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Tracking Details
                                </h3>
                                <InfoRow label="UTM Source" value={lead.utm_source} />
                                <InfoRow label="UTM Medium" value={lead.utm_medium} />
                                <InfoRow label="UTM Campaign" value={lead.utm_campaign} />
                                <InfoRow label="Assigned To" value={lead.partners_leads_assigned_toTopartners?.name || "Unassigned"} />
                                <InfoRow
                                    label="Created At"
                                    value={
                                        lead.created_at
                                            ? format(new Date(lead.created_at), "dd MMM yyyy, hh:mm a")
                                            : "-"
                                    }
                                />
                            </div>
                        </div>
                        <ApplicationDetailsView leadId={lead?.id ?? ""} />
                    </Tab>

                    <Tab key="notes" title="Notes">
                        <NotesTab leadId={lead?.id ?? ""} />
                    </Tab>

                    <Tab key="followups" title="Follow Ups">
                        <FollowUpComponent
                            leadId={lead?.id ?? ""}
                            leadName={lead?.name ?? ""}
                            leadPhone={lead?.mobile ?? ""}
                        />
                    </Tab>

                    <Tab key="documents" title="Documents">
                        <DocumentsTab />
                    </Tab>

                    <Tab key="courses" title="Courses">
                        <CoursesTab />
                    </Tab>

                    <Tab key="tasks" title="Tasks">
                        <TasksTab />
                    </Tab>

                    <Tab key="payments" title="Payments">
                        <PaymentsTab leadId={id}/>
                    </Tab>

                    <Tab key="emails" title="Emails">
                        <EmailsTab />
                    </Tab>

                    <Tab key="financials" title="Financials">
                        <FinancialsTab />
                    </Tab>

                    <Tab key="whatsapp" title="WhatsApp">
                        <WhatsAppTab />
                    </Tab>

                    <Tab key="chat" title="Chat">
                        <ChatTab />
                    </Tab>

                    <Tab key="timeline" title="Timeline">
                        <TimeLineTab leadName={lead?.name ?? ""} leadId={lead?.id ?? ""} />
                    </Tab>
                </Tabs>
            </div>

            <LeadFormSheet
                isOpen={isSheetOpen}
                onOpenChange={handleSheetStateChange}
                lead={lead}
            />
        </>
    );
}
