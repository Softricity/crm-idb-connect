"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLeadStore, Lead } from "@/stores/useLeadStore";
import StatusTimeline from "@/components/leads-components/leadStatusTimeline";
import LeadFormSheet from "@/components/leads-components/createUpdateLead";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FilePen } from "lucide-react";

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

    const { fetchLeadById, updateLead } = useLeadStore();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setSheetOpen] = useState(false);

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

        const payload: { status: string; reason?: string } = {
            status: newStatus,
        };

        if (reason) {
            payload.reason = reason;
        }

        try {
            await updateLead(lead.id, payload);
            setLead(prev => {
                if (!prev) return null;
                const updatedLead = { ...prev, ...payload };
                return updatedLead;
            });
            toast.success("Lead status updated successfully!");
        } catch (error) {
            toast.error("Failed to update lead status.");
        }
    };

    const handleSheetStateChange = (isOpen: boolean) => {
        setSheetOpen(isOpen);
        if (!isOpen) {
            fetchAndSetLead();
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading lead details...</div>;
    }

    if (!lead) {
        return <div className="p-8 text-center text-red-500">Lead not found.</div>;
    }

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
                                {lead.assigned_to || "Unassigned"}
                            </p>
                        </div>
                        <Button onClick={() => setSheetOpen(true)} className="text-gray-700/90 font-bold "><FilePen /> Update Details</Button>
                    </div>
                </div>

                <StatusTimeline
                    currentStatus={lead.status || "new"}
                    onChange={handleStatusChange}
                />


                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Personal & Lead Details
                        </h3>
                        <InfoRow label="Full Name" value={lead.name} />
                        <InfoRow label="Mobile" value={lead.mobile} />
                        <InfoRow label="Email" value={lead.email} />
                        <InfoRow label="City" value={lead.city} />
                        <InfoRow label="Lead Status" value={lead.status} />
                        {lead.status === "cold" || lead.status === "rejected" ? (
                            <InfoRow label="Reason for Status" value={lead.reason} />
                        ) : null}
                        <InfoRow label="Lead Type" value={lead.type} />
                        <InfoRow label="Lead Purpose" value={lead.purpose} />

                        <InfoRow label="Preferred Country" value={lead.preferred_country} />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Tracking Details
                        </h3>
                        <InfoRow label="UTM Source" value={lead.utm_source} />
                        <InfoRow label="UTM Medium" value={lead.utm_medium} />
                        <InfoRow label="UTM Campaign" value={lead.utm_campaign} />
                        <InfoRow label="Assigned To" value={lead.assigned_to} />
                        <InfoRow
                            label="Created At"
                            value={lead.created_at ? format(new Date(lead.created_at), "dd MMM yyyy, hh:mm a") : '-'}
                        />
                    </div>
                </div>
            </div>

            <LeadFormSheet
                isOpen={isSheetOpen}
                onOpenChange={handleSheetStateChange}
                lead={lead}
            />
        </>
    );
}