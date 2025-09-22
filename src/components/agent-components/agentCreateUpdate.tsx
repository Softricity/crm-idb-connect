"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { usePartnerStore, Partner } from "@/stores/usePartnerStore";
import { validateMobile } from "@/lib/validation";
import { AgentFormFields } from "./agentForm";
import { Value } from "react-phone-number-input";

type PartnerFormData = Omit<
    Partner,
    "association_date" | "agreement_start_date" | "agreement_end_date"
> & {
    association_date?: Date;
    agreement_start_date?: Date;
    agreement_end_date?: Date;
};

interface AgentFormProps {
    agent?: Partner;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

export function AgentForm({ agent, open, onOpenChange }: AgentFormProps) {
    const { addPartner, updatePartner } = usePartnerStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState<Partial<PartnerFormData>>({
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
        association_type: "",
        association_date: undefined,
        agreement_start_date: undefined,
        agreement_end_date: undefined,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof PartnerFormData, string>>>({});

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
            case "association_type":
                return !value ? "Select association type" : "";
            case "association_date":
                return !value ? "Pick association date" : "";
            case "agreement_start_date":
                return !value ? "Pick start date" : "";
            case "agreement_end_date":
                return !value ? "Pick end date" : "";
            default:
                return "";
        }
    };

    function validateAgentForm() {
        const newErrors: Partial<Record<keyof PartnerFormData, string>> = {};
        Object.keys(formData).forEach((key) => {
            const field = key as keyof PartnerFormData;
            const error = validateField(field, formData[field]);
            if (error) {
                if (field !== 'remarks') {
                    newErrors[field] = error;
                }
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
                    association_date: agent.association_date
                        ? new Date(agent.association_date)
                        : undefined,
                    agreement_start_date: agent.agreement_start_date
                        ? new Date(agent.agreement_start_date)
                        : undefined,
                    agreement_end_date: agent.agreement_end_date
                        ? new Date(agent.agreement_end_date)
                        : undefined,
                });
            } else {
                setFormData({
                    name: "", email: "", mobile: "", password: "", agency_name: "",
                    address: "", city: "", state: "", area: "", zone: "",
                    remarks: "", association_type: "", association_date: undefined,
                    agreement_start_date: undefined, agreement_end_date: undefined,
                });
            }
        } else {
            setErrors({});
        }
    }, [agent, open]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
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

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({ ...prev, association_type: value }));
        const error = validateField("association_type", value);
        setErrors((prev) => ({ ...prev, association_type: error }));
    };

    const handleDateChange = (name: keyof PartnerFormData, date: Date | undefined) => {
        setFormData((prev) => ({ ...prev, [name]: date }));
        const error = validateField(name, date);
        setErrors((prev) => ({ ...prev, [name]: error }));
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
            const partnerData = {
                ...formData,
                role: "agent" as const,
                association_date: formData.association_date?.toISOString(),
                agreement_start_date: formData.agreement_start_date?.toISOString(),
                agreement_end_date: formData.agreement_end_date?.toISOString(),
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
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl w-full overflow-y-auto px-8 py-10 bg-gray-50">
                <SheetHeader>
                    <SheetTitle className="text-2xl font-semibold tracking-tight text-gray-900">
                        {agent ? "Edit Agent" : "Add New Agent"}
                    </SheetTitle>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-12">
                    <AgentFormFields
                        formData={formData}
                        errors={errors}
                        isSubmitting={isSubmitting}
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                        handleChange={handleChange}
                        handlePhoneChange={handlePhoneChange}
                        handleSelectChange={handleSelectChange}
                        handleDateChange={handleDateChange}
                    />

                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="rounded-lg px-5 py-2 border-gray-300 hover:bg-gray-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="rounded-lg px-6 py-2 bg-primary text-white shadow hover:opacity-90 transition"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : agent ? (
                                "Update Agent"
                            ) : (
                                "Add Agent"
                            )}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}