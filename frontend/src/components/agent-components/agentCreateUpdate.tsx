"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    Button,
} from "@heroui/react";
import { useAgentStore, Agent } from "@/stores/useAgentStore";
import { useBranchStore } from "@/stores/useBranchStore";
import { AgentFormFields } from "./agentForm";
import { Value } from "react-phone-number-input";

interface AgentFormProps {
    agent?: Agent;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

export function AgentForm({ agent, open, onOpenChange }: AgentFormProps) {
    const { addAgent, updateStatus } = useAgentStore();
    const { selectedBranch } = useBranchStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Initial State with new fields
    const [formData, setFormData] = useState<Partial<Agent>>({
        name: "",
        email: "",
        mobile: "",
        password: "",
        agency_name: "",
        business_reg_no: "",
        region: "",
        country: "India",
        state: "",
        city: "",
        address: "",
        status: "PENDING",
        branch_id: selectedBranch?.id
    });
    
    const [errors, setErrors] = useState<Partial<Record<keyof Agent, string>>>({});

    useEffect(() => {
        if (open) {
            if (agent) {
                // Edit Mode: Populate data, clear password
                setFormData({ ...agent, password: "" });
            } else {
                // Create Mode: Reset
                setFormData({
                    name: "", email: "", mobile: "", password: "",
                    agency_name: "", business_reg_no: "",
                    region: "", country: "India", state: "", city: "", address: "",
                    status: "PENDING",
                    branch_id: selectedBranch?.id
                });
            }
            setErrors({});
        }
    }, [agent, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error
        if (errors[name as keyof Agent]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof Agent]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handlePhoneChange = (value: Value | undefined) => {
        setFormData((prev) => ({ ...prev, mobile: value || "" }));
        if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: undefined }));
    };

    const validateForm = () => {
        const newErrors: any = {};
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.email) newErrors.email = "Email is required";
        if (!formData.mobile) newErrors.mobile = "Mobile is required";
        if (!formData.id && !formData.password) newErrors.password = "Password is required"; // Only required for new agents
        if (!formData.region) newErrors.region = "Region is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (agent?.id) {
                // Agent Edit Mode: 
                // Currently only status update via specific buttons is standard.
                // If you want full edit, backend needs a PATCH /agents/:id endpoint.
                toast.info("For security, only Approval/Rejection is allowed here for now.");
            } else {
                // Create Mode
                await addAgent(formData);
                toast.success("Agent application submitted successfully.");
                onOpenChange(false);
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Drawer backdrop="blur" isOpen={open} onOpenChange={onOpenChange}>
            <DrawerContent className="sm:max-w-2xl w-full overflow-y-auto p-8 bg-gray-50">
                {(onClose) => (
                    <>
                        <DrawerHeader className="text-2xl font-semibold tracking-tight text-gray-900">
                            {agent ? "Agent Details" : "Onboard New Agent"}
                        </DrawerHeader>

                        <DrawerBody>
                            <form onSubmit={handleSubmit} className="space-y-8 mt-4 pb-10">
                                <AgentFormFields
                                    formData={formData}
                                    errors={errors}
                                    isSubmitting={isSubmitting}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                    handleChange={handleChange}
                                    handleSelectChange={handleSelectChange}
                                    handlePhoneChange={handlePhoneChange}
                                />

                                {/* Admin Actions for Existing Agents */}
                                {agent?.id && agent.status === 'PENDING' && (
                                    <div className="flex gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-yellow-800">Review Application</h4>
                                            <p className="text-sm text-yellow-600">Please verify details before approving.</p>
                                        </div>
                                        <Button color="success" onPress={() => { updateStatus(agent.id!, "APPROVED"); onClose(); }}>
                                            Approve
                                        </Button>
                                        <Button color="danger" onPress={() => { updateStatus(agent.id!, "REJECTED"); onClose(); }}>
                                            Reject
                                        </Button>
                                    </div>
                                )}

                                {/* Submit Button for New Agents */}
                                {!agent?.id && (
                                    <div className="flex justify-end gap-4 pt-4">
                                        <Button variant="light" onPress={onClose}>Cancel</Button>
                                        <Button
                                            color="primary"
                                            type="submit"
                                            isLoading={isSubmitting}
                                            className="text-white"
                                        >
                                            Submit Application
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </DrawerBody>
                    </>
                )}
            </DrawerContent>
        </Drawer>
    );
}