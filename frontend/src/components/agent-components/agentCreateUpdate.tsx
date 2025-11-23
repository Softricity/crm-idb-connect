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
import { usePartnerStore, Partner } from "@/stores/usePartnerStore";
import { validateMobile } from "@/lib/validation";
import { AgentFormFields } from "./agentForm";
import { Value } from "react-phone-number-input";

type PartnerFormData = Partial<Partner>;

interface AgentFormProps {
    agent?: Partner;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

export function AgentForm({ agent, open, onOpenChange }: AgentFormProps) {
    const { addPartner, updatePartner } = usePartnerStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [agentRoleId, setAgentRoleId] = useState<string>("");
    const [formData, setFormData] = useState<PartnerFormData>({
        name: "",
        email: "",
        mobile: "",
        password: "",
        agency_name: "",
        address: "",
        city: "",
        state: "",
        area: "",
        zone: "",
        remarks: "",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof PartnerFormData, string>>>({});

    // Fetch agent role ID
    useEffect(() => {
        const fetchAgentRole = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/roles`);
                const roles = await response.json();
                const agentRole = roles.find((r: any) => r.name?.toLowerCase() === 'agent');
                if (agentRole) {
                    setAgentRoleId(agentRole.id);
                }
            } catch (error) {
                console.error("Failed to fetch agent role:", error);
            }
        };
        if (open) {
            fetchAgentRole();
        }
    }, [open]);

    const validateField = (name: keyof PartnerFormData, value: any): string => {
        switch (name) {
            case "name":
                return !value.trim() ? "Name is required" : "";
            case "email":
                if (!value.trim()) return "Email is required";
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
                return "";
            case "mobile":
                if (!value) return "Mobile number is required";
                if (!validateMobile(value)) return "Invalid mobile number";
                return "";
            case "password":
                if (agent?.id) return "";
                if (!value || value.length < 6) return "Password must be at least 6 characters";
                return "";
            case "agency_name":
                return !value.trim() ? "Agency name is required" : "";
            case "address":
                return !value.trim() ? "Address is required" : "";
            case "city":
                return !value.trim() ? "City is required" : "";
            case "state":
                return !value.trim() ? "State is required" : "";
            case "area":
                return !value.trim() ? "Area is required" : "";
            case "zone":
                return !value.trim() ? "Zone is required" : "";
            default:
                return "";
        }
    };

    function validateAgentForm() {
        const newErrors: Partial<Record<keyof PartnerFormData, string>> = {};
        Object.keys(formData).forEach((key) => {
            const field = key as keyof PartnerFormData;
            const error = validateField(field, formData[field]);
            if (error && field !== "remarks") {
                newErrors[field] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    useEffect(() => {
        if (open) {
            if (agent) {
                setFormData({
                    ...agent,
                });
            } else {
                setFormData({
                    name: "",
                    email: "",
                    mobile: "",
                    password: "",
                    agency_name: "",
                    address: "",
                    city: "",
                    state: "",
                    area: "",
                    zone: "",
                    remarks: "",
                });
            }
        } else {
            setErrors({});
        }
    }, [agent, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const fieldName = name as keyof PartnerFormData;
        setFormData((prev) => ({ ...prev, [fieldName]: value }));
        const error = validateField(fieldName, value);
        setErrors((prev) => ({ ...prev, [fieldName]: error }));
    };

    const handlePhoneChange = (value: Value | undefined) => {
        const newValue = value || "";
        setFormData((prev) => ({ ...prev, mobile: newValue }));
        const error = validateField("mobile", newValue);
        setErrors((prev) => ({ ...prev, mobile: error }));
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        if (!validateAgentForm()) {
            toast.error("Please fix the errors before submitting.");
            setIsSubmitting(false);
            return;
        }

        try {
            if (!agentRoleId) {
                toast.error("Agent role not found. Please contact administrator.");
                setIsSubmitting(false);
                return;
            }

            const partnerData = {
                ...formData,
                role_id: agentRoleId,
            };

            if (agent?.id) {
                if (!partnerData.password) {
                    delete partnerData.password;
                }
                await updatePartner(agent.id, partnerData);
                toast.success("Agent updated successfully.");
            } else {
                await addPartner(partnerData as Omit<Partner, "id" | "created_at">);
                toast.success("Agent added successfully.");
            }

            onOpenChange(false);
        } catch (error) {
            toast.error("Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Drawer backdrop="blur" isOpen={open} onOpenChange={onOpenChange}>
            <DrawerContent className="sm:max-w-2xl w-full overflow-y-hidden p-8 bg-gray-50">
                {(onClose) => (
                    <>
                        <DrawerHeader className="text-2xl font-semibold tracking-tight text-gray-900">
                            {agent ? "Edit Agent" : "Add New Agent"}
                        </DrawerHeader>

                        <DrawerBody>
                            <form onSubmit={handleSubmit} className="space-y-8 mt-4">
                                <AgentFormFields
                                    formData={formData}
                                    errors={errors}
                                    isSubmitting={isSubmitting}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                    handleChange={handleChange}
                                    handlePhoneChange={handlePhoneChange}
                                />

                                <div className="flex justify-end gap-4 pt-4">
                                    <Button
                                        variant="light"
                                        type="button"
                                        onPress={onClose}
                                        isDisabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        color="primary"
                                        type="submit"
                                        isDisabled={isSubmitting}
                                        startContent={
                                            isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null
                                        }
                                        className="text-white"
                                    >
                                        {agent ? "Update Agent" : "Add Agent"}
                                    </Button>
                                </div>
                            </form>
                        </DrawerBody>
                    </>
                )}
            </DrawerContent>
        </Drawer>
    );
}