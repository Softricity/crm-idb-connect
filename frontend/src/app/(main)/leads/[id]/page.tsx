"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
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
import ChatComponent from "@/components/chat/ChatComponent";
import FinancialsTab from "@/components/FinancialsTab";
import CoursesTab from "@/components/leads-components/coursesTab";
import { ForwardDepartmentModal } from "@/components/leads-components/forwardDepartmentModal";
import { SendBackToDocumentsModal } from "@/components/leads-components/sendBackToDocumentsModal";
import { useAuthStore } from "@/stores/useAuthStore";
import {
    ApplicationPermission,
    hasAnyPermission,
    hasPermission,
    LeadPermission,
} from "@/lib/utils";
import { DepartmentsAPI, LeadsAPI } from "@/lib/api";
import LeadDocumentsTab from "@/components/leads-components/leadDocumentsTab";

interface DepartmentOrderConfig {
    order_index: number;
    is_active: boolean;
    is_default: boolean;
}

interface DepartmentRecord {
    id: string;
    name: string;
    code: string;
    is_active: boolean;
    department_orders?: DepartmentOrderConfig | null;
}

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
    const { user } = useAuthStore();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setSheetOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState(defaultTab);
    const [studentPanelOpen, setStudentPanelOpen] = useState(false);
    const [studentPanelUrl, setStudentPanelUrl] = useState("");
    const [studentPanelLoading, setStudentPanelLoading] = useState(false);
    const [forwardModalOpen, setForwardModalOpen] = useState(false);
    const [sendBackModalOpen, setSendBackModalOpen] = useState(false);
    const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);
    const [departments, setDepartments] = useState<DepartmentRecord[]>([]);

    const fetchAndSetLead = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedLead = await fetchLeadById(id);
            setLead(fetchedLead);
        } catch (error: any) {
            const message =
                error?.body?.message || error?.body?.error || error?.message || "Failed to fetch lead.";
            toast.error(message);
            setLead(null);
        } finally {
            setLoading(false);
        }
    }, [id, fetchLeadById]);

    useEffect(() => {
        if (id) {
            fetchAndSetLead();
        }
    }, [id, fetchAndSetLead]);

    useEffect(() => {
        let isMounted = true;
        DepartmentsAPI.fetchDepartments(false)
            .then((data) => {
                if (!isMounted) return;
                setDepartments(Array.isArray(data) ? (data as DepartmentRecord[]) : []);
            })
            .catch((error) => {
                console.error("Failed to fetch departments for lead detail:", error);
                if (isMounted) setDepartments([]);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleStatusChange = async (newStatus: string) => {
        if (!lead || !lead.id) return;

        const payload: { status: string } = { status: newStatus };

        try {
            await updateLead(lead.id, payload);

            const refreshedLead = await fetchLeadById(lead.id);
            if (refreshedLead) {
                setLead(refreshedLead);
            } else {
                setLead((prev) => (prev ? { ...prev, ...payload } : null));
            }

            setTimelineRefreshKey((prev) => prev + 1);
            toast.success("Lead status updated successfully!");
        } catch (error) {
            toast.error("Failed to update lead status.");
        }
    };

    const handleSheetStateChange = (isOpen: boolean) => {
        setSheetOpen(isOpen);
        if (!isOpen) {
            fetchAndSetLead();
            setTimelineRefreshKey((prev) => prev + 1);
        }
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

    const sortedActiveDepartments = departments
        .filter(
            (department) =>
                department.is_active && (department.department_orders?.is_active ?? true),
        )
        .sort(
            (a, b) =>
                (a.department_orders?.order_index ?? Number.MAX_SAFE_INTEGER) -
                (b.department_orders?.order_index ?? Number.MAX_SAFE_INTEGER),
        );
    const currentDepartmentIndex = sortedActiveDepartments.findIndex(
        (department) => department.id === lead.current_department_id,
    );
    const nextDepartmentLabel =
        currentDepartmentIndex >= 0
            ? sortedActiveDepartments[currentDepartmentIndex + 1]?.name || null
            : null;
    const canForwardToNextDepartment =
        Boolean(nextDepartmentLabel && lead.can_forward_to_next_department) &&
        hasPermission(user?.permissions || [], ApplicationPermission.LEAD_TO_APPLICATION);

    // --- Department-based tab access control ---
    // All tabs are visible but some are disabled based on the user's department(s).
    const userDeptIds = user?.department_ids || [];
    const userDeptCodes = departments
        .filter(d => userDeptIds.includes(d.id))
        .map(d => d.code.toUpperCase());
    const isFrontDesk = userDeptCodes.includes('FRONTDESK');
    const isCounselling = userDeptCodes.includes('COUNSELLING');
    const isDocuments = userDeptCodes.includes('DOCUMENTS');
    const isAccounts = userDeptCodes.includes('ACCOUNTS');

    const disabledTabs = new Set<string>();
    if (isFrontDesk) {
        // Front Desk: only the Details tab (with StatusTimeline) is accessible
        disabledTabs.add('notes');
        disabledTabs.add('followups');
        disabledTabs.add('documents');
        disabledTabs.add('courses');
        disabledTabs.add('payments');
        disabledTabs.add('financials');
        disabledTabs.add('chat');
        disabledTabs.add('timeline');
    }
    if (isCounselling) {
        disabledTabs.add('documents');
        disabledTabs.add('payments');
        disabledTabs.add('financials');
    }
    if (isDocuments) {
        disabledTabs.add('payments');
        disabledTabs.add('financials');
    }
    if (isAccounts) {
        // Accounts: only Payments tab is accessible
        disabledTabs.add('details');
        disabledTabs.add('notes');
        disabledTabs.add('followups');
        disabledTabs.add('documents');
        disabledTabs.add('courses');
        disabledTabs.add('financials');
        disabledTabs.add('chat');
        disabledTabs.add('timeline');
    }

    const isStudentPanelDisabled = isFrontDesk || isCounselling;

    // Resolve Compliance department ID dynamically for send-back-to-Documents button
    const complianceDepartment = departments.find(
        (dept) => dept.code.toUpperCase() === "COMPLIANCE" && dept.is_active,
    );
    const isUserCompliance = userDeptCodes.includes("COMPLIANCE");
    const isLeadInCompliance =
        isUserCompliance &&
        complianceDepartment != null &&
        lead.current_department_id === complianceDepartment.id;

    const canEditDocuments = hasAnyPermission(user?.permissions || [], [
        LeadPermission.LEAD_UPDATE,
        LeadPermission.LEAD_MANAGE,
    ]);

    const openStudentPanel = async () => {
        if (!lead?.id) return;
        setStudentPanelLoading(true);
        try {
            const response = await LeadsAPI.getStudentPanelAccessToken(lead.id);
            const token = response?.token;
            if (!token) {
                throw new Error("Failed to get student panel access token.");
            }
            const studentPanelBase = process.env.NEXT_PUBLIC_STUDENT_PANEL_URL || "https://student.idbconnect.global";
            setStudentPanelUrl(`${studentPanelBase}/login?staff_token=${encodeURIComponent(token)}`);
            setStudentPanelOpen(true);
        } catch (error: any) {
            toast.error(error?.message || "Unable to open student panel.");
        } finally {
            setStudentPanelLoading(false);
        }
    };

    return (
        <>
            <div className="p-6">
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
                        {canForwardToNextDepartment && (
                            <Button
                                onPress={() => setForwardModalOpen(true)}
                                color="secondary"
                                variant="flat"
                            >
                                {`Forward to ${nextDepartmentLabel}`}
                            </Button>
                        )}
                        {isLeadInCompliance && (
                            <Button
                                onPress={() => setSendBackModalOpen(true)}
                                color="warning"
                                variant="flat"
                            >
                                Send Back to Documents
                            </Button>
                        )}
                        <Button
                            onPress={openStudentPanel}
                            color="secondary"
                            variant="bordered"
                            isLoading={studentPanelLoading}
                            isDisabled={isStudentPanelDisabled}
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
                                    src={studentPanelUrl}
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
                    currentDepartmentId={lead.current_department_id}
                    onChange={handleStatusChange}
                />
                <Tabs 
                    aria-label="Lead Tabs" 
                    variant="underlined" 
                    className="mt-6" 
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => setSelectedTab(key as string)}
                    isDisabled={false}
                >
                    <Tab key="details" title="Details" isDisabled={disabledTabs.has('details')}>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Personal & Lead Details
                                </h3>
                                <InfoRow label="Full Name" value={lead.name} />
                                <InfoRow label="Mobile" value={lead.mobile} />
                                <InfoRow label="Email" value={lead.email} />
                                <InfoRow label="Lead Status" value={lead.status} />
                                <InfoRow label="Lead Type" value={lead.type} />
                                <InfoRow label="Lead Prefered Course" value={lead.preferred_course} />
                                <InfoRow label="Preferred Country" value={lead.preferred_country} />
                                <InfoRow label="Exam Taken" value={lead.exam_taken} />
                                <InfoRow label="Exam Score" value={lead.exam_score} />
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

                    <Tab key="notes" title="Notes" isDisabled={disabledTabs.has('notes')}>
                        <NotesTab leadId={lead?.id ?? ""} />
                    </Tab>

                    <Tab key="followups" title="Follow Ups" isDisabled={disabledTabs.has('followups')}>
                        <FollowUpComponent
                            leadId={lead?.id ?? ""}
                            leadName={lead?.name ?? ""}
                            leadPhone={lead?.mobile ?? ""}
                        />
                    </Tab>

                    <Tab key="documents" title="Documents" isDisabled={disabledTabs.has('documents')}>
                        <LeadDocumentsTab leadId={lead?.id ?? ""} canEdit={canEditDocuments} />
                    </Tab>

                    <Tab key="courses" title="Courses" isDisabled={disabledTabs.has('courses')}>
                        <CoursesTab leadId={lead?.id ?? ""} />
                    </Tab>

                    <Tab key="payments" title="Payments" isDisabled={disabledTabs.has('payments')}>
                        <PaymentsTab leadId={id} />
                    </Tab>

                    <Tab key="financials" title="Financials" isDisabled={disabledTabs.has('financials')}>
                        <FinancialsTab leadId={lead?.id ?? ""}/>
                    </Tab>

                    <Tab key="chat" title="Chat" isDisabled={disabledTabs.has('chat')}>
                        <ChatComponent 
                            leadId={lead?.id ?? ""} 
                            leadName={lead?.name ?? ""} 
                            currentUserType="PARTNER" 
                        />
                    </Tab>

                    <Tab key="timeline" title="Timeline" isDisabled={disabledTabs.has('timeline')}>
                        <TimeLineTab
                            leadName={lead?.name ?? ""}
                            leadId={lead?.id ?? ""}
                            refreshKey={timelineRefreshKey}
                        />
                    </Tab>
                </Tabs>
            </div>

            <LeadFormSheet
                isOpen={isSheetOpen}
                onOpenChange={handleSheetStateChange}
                lead={lead}
            />

            <ForwardDepartmentModal
                isOpen={forwardModalOpen}
                onOpenChange={setForwardModalOpen}
                lead={lead}
                onForwarded={fetchAndSetLead}
            />

            <SendBackToDocumentsModal
                isOpen={sendBackModalOpen}
                onOpenChange={setSendBackModalOpen}
                lead={lead}
                onForwarded={fetchAndSetLead}
            />
        </>
    );
}
