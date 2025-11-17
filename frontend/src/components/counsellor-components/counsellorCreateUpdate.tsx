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
import { CounsellorFormFields } from "./counsellorFormFields";
import { Value } from "react-phone-number-input";

type PartnerFormData = Partial<Partner>;

interface CounsellorFormProps {
    counsellor?: Partner;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

export function CounsellorForm({ counsellor, open, onOpenChange }: CounsellorFormProps) {
    const { addPartner, updatePartner } = usePartnerStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState<PartnerFormData>({
        name: "",
        email: "",
        mobile: "",
        password: "",
        address: "",
        city: "",
        state: "",
        area: "",
        zone: "",
        remarks: "",
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
                if (counsellor?.id) return "";
                if (!value || value.length < 6) return "Password must be at least 6 characters";
                return "";
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

    function validateCounsellorForm() {
        const newErrors: Partial<Record<keyof PartnerFormData, string>> = {};
        Object.keys(formData).forEach((key) => {
            const field = key as keyof PartnerFormData;
            const error = validateField(field, formData[field]);
            if (error && field !== "remarks" && field !== "agency_name") {
                newErrors[field] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    useEffect(() => {
        if (open) {
            if (counsellor) {
                setFormData({
                    ...counsellor,
                });
            } else {
                setFormData({
                    name: "",
                    email: "",
                    mobile: "",
                    password: "",
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
    }, [counsellor, open]);

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

        if (!validateCounsellorForm()) {
            toast.error("Please fix the errors before submitting.");
            setIsSubmitting(false);
            return;
        }

        try {
            const partnerData = {
                ...formData,
                role: "counsellor" as const,
            };

            if (counsellor?.id) {
                if (!partnerData.password) {
                    delete partnerData.password;
                }
                await updatePartner(counsellor.id, partnerData);
                toast.success("Counsellor updated successfully.");
            } else {
                await addPartner(partnerData as Omit<Partner, "id" | "created_at">);
                toast.success("Counsellor added successfully.");
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
                            {counsellor ? "Edit Counsellor" : "Add New Counsellor"}
                        </DrawerHeader>

                        <DrawerBody>
                            <form onSubmit={handleSubmit} className="space-y-8 mt-4">
                                <CounsellorFormFields
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
                                        {counsellor ? "Update Counsellor" : "Add Counsellor"}
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
