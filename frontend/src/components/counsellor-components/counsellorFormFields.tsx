"use client";

import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PhoneInputWithCountrySelect, { Value } from "react-phone-number-input";
import { Partner } from "@/stores/usePartnerStore"; 

type PartnerFormData = Partial<Partner>;

interface CounsellorFormFieldsProps {
    formData: PartnerFormData; 
    errors: Partial<Record<keyof PartnerFormData, string>>; 
    isSubmitting: boolean;
    showPassword: boolean;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handlePhoneChange: (value: Value | undefined) => void;
}

const FieldWrapper = ({
    label,
    name,
    errors,
    children,
}: {
    label: string;
    name: keyof PartnerFormData; 
    errors: Partial<Record<keyof PartnerFormData, string>>; 
    children: React.ReactNode;
}) => (
    <div className="flex flex-col gap-1">
        <Label className="text-sm text-gray-700">{label}</Label>
        {children}
        {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    </div>
);

export function CounsellorFormFields({
    formData,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    handleChange,
    handlePhoneChange,
}: CounsellorFormFieldsProps) {
    return (
        <div className="space-y-12 ">
            <div className="space-y-6 rounded-xl border p-6 shadow-sm bg-white hover:shadow-md transition">
                <h3 className="text-lg font-medium text-gray-800 border-b pb-2">
                    Personal Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FieldWrapper label="Name" name="name" errors={errors}>
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="rounded-lg placeholder:text-gray-400 focus:ring-2 focus:ring-primary/70 border-gray-300"
                            required
                        />
                    </FieldWrapper>

                    <FieldWrapper label="Email" name="email" errors={errors}>
                        <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john.doe@example.com"
                            className="rounded-lg placeholder:text-gray-400 focus:ring-2 focus:ring-primary/70 border-gray-300"
                            required
                        />
                    </FieldWrapper>

                    <FieldWrapper label="Mobile Number*" name="mobile" errors={errors}>
                        <PhoneInputWithCountrySelect
                            international
                            defaultCountry="IN"
                            value={formData.mobile as Value}
                            onChange={handlePhoneChange}
                            className="border rounded-lg px-3 py-1 shadow focus:ring-2 focus:ring-primary/70 border-gray-300"
                        />
                    </FieldWrapper>

                    <FieldWrapper label="Password" name="password" errors={errors}>
                        <div className="relative">
                            <Input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={!formData.id ? "********" : "Enter new password (optional)"}
                                className="rounded-lg placeholder:text-gray-400 pr-10 focus:ring-2 focus:ring-primary/70 border-gray-300"
                                required={!formData.id} 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </FieldWrapper>
                </div>
            </div>

            <div className="space-y-6 rounded-xl border p-6 shadow-sm bg-white hover:shadow-md transition">
                <h3 className="text-lg font-medium text-gray-800 border-b pb-2">
                    Location Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { label: "Address", name: "address", placeholder: "123 Main St" },
                        { label: "City", name: "city", placeholder: "New York" },
                        { label: "State", name: "state", placeholder: "NY" },
                        { label: "Area", name: "area", placeholder: "Downtown" },
                        { label: "Zone", name: "zone", placeholder: "Commercial" },
                    ].map((field) => (
                        <FieldWrapper
                            key={field.name}
                            label={field.label}
                            name={field.name as keyof PartnerFormData} 
                            errors={errors}
                        >
                            <Input
                                name={field.name}
                                value={(formData as any)[field.name]}
                                onChange={handleChange}
                                placeholder={field.placeholder}
                                className="rounded-lg placeholder:text-gray-400 focus:ring-2 focus:ring-primary/70 border-gray-300"
                                required
                            />
                        </FieldWrapper>
                    ))}
                    <FieldWrapper label="Remarks" name="remarks" errors={errors}>
                        <Textarea
                            name="remarks"
                            value={formData.remarks ?? ""}
                            onChange={handleChange}
                            placeholder="Any additional remarks..."
                            className="resize-none rounded-lg placeholder:text-gray-400 focus:ring-2 focus:ring-primary/70 border-gray-300"
                        />
                    </FieldWrapper>
                </div>
            </div>
        </div>
    );
}
