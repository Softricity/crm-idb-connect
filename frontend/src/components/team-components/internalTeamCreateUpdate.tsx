"use client";

import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
} from "@heroui/react";
import { usePartnerStore, Partner } from "@/stores/usePartnerStore";
import { useBranchStore } from "@/stores/useBranchStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import PhoneInputWithCountrySelect, { Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { validateMobile } from "@/lib/validation";
import { PartnersAPI, RolesAPI } from "@/lib/api";
import { BranchPermission, hasPermission } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface InternalTeamCreateUpdateProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    member?: Partner | null;
}

interface FormData {
    name: string;
    email: string;
    mobile: string;
    password: string;
    role_id: string;
    branch_id: string;
    address: string;
    city: string;
    state: string;
    area: string;
    zone: string;
    remarks: string;
}

export function InternalTeamCreateUpdate({
    isOpen,
    onOpenChange,
    member,
}: InternalTeamCreateUpdateProps) {
    const { addPartner, updatePartner } = usePartnerStore();
    const { branches, fetchBranches } = useBranchStore();
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const currentUserRole = (user?.role || '').toLowerCase();
    const isUserSuperAdmin = currentUserRole === 'super admin';
    
    // Check if user can manage branches
    const canManageBranches = user?.permissions 
        ? hasPermission(user.permissions, BranchPermission.BRANCH_MANAGE)
        : false;

    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        mobile: "",
        password: "",
        role_id: "",
        branch_id: user?.branch_id || "",
        address: "",
        city: "",
        state: "",
        area: "",
        zone: "",
        remarks: "",
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

    // Fetch roles and branches from backend
    useEffect(() => {
        const fetchRoles = async () => {
            setLoadingRoles(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/roles`, {
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`,
                    },
                });
                const data = await response.json();
                // Filter out agent role for internal team
                setRoles(data.filter((r: any) => r.name?.toLowerCase() !== 'agent'));
            } catch (error) {
                console.error("Failed to fetch roles:", error);
                toast.error("Failed to load roles");
            } finally {
                setLoadingRoles(false);
            }
        };

        if (isOpen) {
            fetchRoles();
            fetchBranches();
        }
    }, [isOpen, fetchBranches]);

    // Helper to get auth token
    const getAuthToken = () => {
        if (typeof document === 'undefined') return null;
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(c => c.trim().startsWith('auth-token='));
        if (!tokenCookie) return null;
        try {
            return decodeURIComponent(tokenCookie.split('=')[1]);
        } catch {
            return null;
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (member) {
                setFormData({
                    name: member.name || "",
                    email: member.email || "",
                    mobile: member.mobile || "",
                    password: "",
                    role_id: member.role_id || "",
                    branch_id: member.branch_id || user?.branch_id || "",
                    address: member.address || "",
                    city: member.city || "",
                    state: member.state || "",
                    area: member.area || "",
                    zone: member.zone || "",
                    remarks: member.remarks || "",
                });
            } else {
                setFormData({
                    name: "",
                    email: "",
                    mobile: "",
                    password: "",
                    role_id: "",
                    branch_id: user?.branch_id || "",
                    address: "",
                    city: "",
                    state: "",
                    area: "",
                    zone: "",
                    remarks: "",
                });
            }
            setErrors({});
        }
    }, [member, isOpen, user?.branch_id]);

    const validateField = (field: keyof FormData, value: string): string => {
        switch (field) {
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
                if (member?.id) return "";
                if (!value || value.length < 6) return "Password must be at least 6 characters";
                return "";
            case "role_id":
                return !value ? "Role is required" : "";
            case "address":
            case "city":
            case "state":
            case "area":
            case "zone":
                return !value.trim() ? `${field.charAt(0).toUpperCase() + field.slice(1)} is required` : "";
            default:
                return "";
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const fieldName = name as keyof FormData;
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

    const validateForm = () => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        Object.keys(formData).forEach((key) => {
            const field = key as keyof FormData;
            if (field !== "remarks") {
                const error = validateField(field, formData[field]);
                if (error) {
                    newErrors[field] = error;
                }
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!validateForm()) {
            toast.error("Please fix the errors before submitting.");
            setIsSubmitting(false);
            return;
        }

        try {
            const partnerData = { ...formData };

            if (member?.id) {
                if (!partnerData.password) {
                    delete (partnerData as any).password;
                }
                await updatePartner(member.id, partnerData as any);
                toast.success("Team member updated successfully.");
            } else {
                await addPartner(partnerData as any);
                toast.success("Team member added successfully.");
            }

            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to save team member");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="3xl"
            scrollBehavior="inside"
        >
            <ModalContent>
                {(onClose) => (
                    <form onSubmit={handleSubmit}>
                        <ModalHeader>
                            {member ? "Edit Team Member" : "Add Team Member"}
                        </ModalHeader>
                        <ModalBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    isInvalid={!!errors.name}
                                    errorMessage={errors.name}
                                    isRequired
                                />
                                <Input
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    isInvalid={!!errors.email}
                                    errorMessage={errors.email}
                                    isRequired
                                />
                                <div>
                                    <label className="text-sm">Mobile *</label>
                                    <PhoneInputWithCountrySelect
                                        international
                                        defaultCountry="IN"
                                        value={formData.mobile}
                                        onChange={handlePhoneChange}
                                        className={errors.mobile ? "border-red-500" : ""}
                                    />
                                    {errors.mobile && (
                                        <span className="text-xs text-red-500">{errors.mobile}</span>
                                    )}
                                </div>
                                <Input
                                    label={member ? "Password (leave blank to keep current)" : "Password"}
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    isInvalid={!!errors.password}
                                    errorMessage={errors.password}
                                    isRequired={!member}
                                />
                                <Select
                                    label="Branch"
                                    name="branch_id"
                                    selectedKeys={formData.branch_id ? [formData.branch_id] : []}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData(prev => ({ ...prev, branch_id: value }));
                                        setErrors(prev => ({ ...prev, branch_id: "" }));
                                    }}
                                    isDisabled={!canManageBranches}
                                    description={!canManageBranches ? `Assigned to ${user?.branch_name || 'your branch'}` : "Select branch for this team member"}
                                    isRequired
                                >
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id}>
                                            {`${branch.name} (${branch.type})`}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Select
                                    label="Role"
                                    name="role_id"
                                    selectedKeys={formData.role_id ? [formData.role_id] : []}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData(prev => ({ ...prev, role_id: value }));
                                        setErrors(prev => ({ ...prev, role_id: "" }));
                                    }}
                                    isInvalid={!!errors.role_id}
                                    errorMessage={errors.role_id}
                                    isLoading={loadingRoles}
                                    isRequired
                                >
                                    {roles.map((role) => {
                                        const roleName = (role.name || '').toLowerCase();
                                        // Only Super Admin can create Branch Manager or Super Admin
                                        const disabled = !isUserSuperAdmin && (roleName === 'branch manager' || roleName === 'super admin');
                                        return (
                                            <SelectItem key={role.id} isDisabled={disabled}>
                                                {role.name}
                                            </SelectItem>
                                        );
                                    })}
                                </Select>
                                <Input
                                    label="Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    isInvalid={!!errors.address}
                                    errorMessage={errors.address}
                                    isRequired
                                />
                                <Input
                                    label="City"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    isInvalid={!!errors.city}
                                    errorMessage={errors.city}
                                    isRequired
                                />
                                <Input
                                    label="State"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    isInvalid={!!errors.state}
                                    errorMessage={errors.state}
                                    isRequired
                                />
                                <Input
                                    label="Area"
                                    name="area"
                                    value={formData.area}
                                    onChange={handleChange}
                                    isInvalid={!!errors.area}
                                    errorMessage={errors.area}
                                    isRequired
                                />
                                <Input
                                    label="Zone"
                                    name="zone"
                                    value={formData.zone}
                                    onChange={handleChange}
                                    isInvalid={!!errors.zone}
                                    errorMessage={errors.zone}
                                    isRequired
                                />
                                <Textarea
                                    label="Remarks"
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    className="md:col-span-2"
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                type="submit"
                                isLoading={isSubmitting}
                            >
                                {member ? "Update" : "Add"} Team Member
                            </Button>
                        </ModalFooter>
                    </form>
                )}
            </ModalContent>
        </Modal>
    );
}
