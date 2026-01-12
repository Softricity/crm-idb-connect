"use client";

import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PhoneInputWithCountrySelect, { Value } from "react-phone-number-input";
import { Agent } from "@/stores/useAgentStore"; 

type AgentFormData = Partial<Agent>;

interface AgentFormFieldsProps {
    formData: AgentFormData; 
    errors: Partial<Record<keyof AgentFormData, string>>; 
    isSubmitting: boolean;
    showPassword: boolean;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSelectChange: (name: string, value: string) => void;
    handlePhoneChange: (value: Value | undefined) => void;
}

const FieldWrapper = ({
    label,
    name,
    errors,
    children,
}: {
    label: string;
    name: keyof AgentFormData; 
    errors: Partial<Record<keyof AgentFormData, string>>; 
    children: React.ReactNode;
}) => (
    <div className="flex flex-col gap-1">
        <Label className="text-sm text-gray-700">{label}</Label>
        {children}
        {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    </div>
);

export function AgentFormFields({
    formData,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    handleChange,
    handleSelectChange,
    handlePhoneChange,
}: AgentFormFieldsProps) {
    return (
        <div className="space-y-12">
            {/* Personal Info */}
            <div className="space-y-6 rounded-xl border p-6 shadow-sm bg-white">
                <h3 className="text-lg font-medium text-gray-800 border-b pb-2">
                    Personal Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FieldWrapper label="Name" name="name" errors={errors}>
                        <Input
                            name="name"
                            value={formData.name || ""}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="rounded-lg border-gray-300"
                            required
                        />
                    </FieldWrapper>

                    <FieldWrapper label="Email" name="email" errors={errors}>
                        <Input
                            name="email"
                            type="email"
                            value={formData.email || ""}
                            onChange={handleChange}
                            placeholder="john.doe@example.com"
                            className="rounded-lg border-gray-300"
                            required
                        />
                    </FieldWrapper>

                    <FieldWrapper label="Mobile Number*" name="mobile" errors={errors}>
                        <PhoneInputWithCountrySelect
                            international
                            defaultCountry="IN"
                            value={formData.mobile as Value}
                            onChange={handlePhoneChange}
                            className="border rounded-lg px-3 py-1 shadow border-gray-300"
                        />
                    </FieldWrapper>

                    <FieldWrapper label="Password" name="password" errors={errors}>
                        <div className="relative">
                            <Input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password || ""}
                                onChange={handleChange}
                                placeholder={!formData.id ? "********" : "Leave blank to keep current"}
                                className="rounded-lg pr-10 border-gray-300"
                                required={!formData.id} 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </FieldWrapper>
                </div>
            </div>

            {/* Business & Location Info */}
            <div className="space-y-6 rounded-xl border p-6 shadow-sm bg-white">
                <h3 className="text-lg font-medium text-gray-800 border-b pb-2">
                    Business & Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FieldWrapper label="Agency Name" name="agency_name" errors={errors}>
                         <Input name="agency_name" value={formData.agency_name || ""} onChange={handleChange} placeholder="Global Edu" className="rounded-lg border-gray-300" required />
                    </FieldWrapper>

                    <FieldWrapper label="Business Reg. No." name="business_reg_no" errors={errors}>
                         <Input name="business_reg_no" value={formData.business_reg_no || ""} onChange={handleChange} placeholder="GST/Tax ID" className="rounded-lg border-gray-300" />
                    </FieldWrapper>

                    <FieldWrapper label="Region" name="region" errors={errors}>
                        <Select value={formData.region} onValueChange={(val) => handleSelectChange("region", val)}>
                            <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Select Region" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="APAC">APAC</SelectItem>
                                <SelectItem value="EMEA">EMEA</SelectItem>
                                <SelectItem value="NA">North America</SelectItem>
                                <SelectItem value="LATAM">LATAM</SelectItem>
                                <SelectItem value="SA">South Asia</SelectItem>
                            </SelectContent>
                        </Select>
                    </FieldWrapper>

                    <FieldWrapper label="Country" name="country" errors={errors}>
                        <Input name="country" value={formData.country || ""} onChange={handleChange} placeholder="India" className="rounded-lg border-gray-300" required />
                    </FieldWrapper>

                    <FieldWrapper label="State" name="state" errors={errors}>
                        <Input name="state" value={formData.state || ""} onChange={handleChange} placeholder="Delhi" className="rounded-lg border-gray-300" required />
                    </FieldWrapper>

                    <FieldWrapper label="City" name="city" errors={errors}>
                        <Input name="city" value={formData.city || ""} onChange={handleChange} placeholder="New Delhi" className="rounded-lg border-gray-300" required />
                    </FieldWrapper>

                    <div className="md:col-span-2">
                         <FieldWrapper label="Full Address" name="address" errors={errors}>
                            <Textarea name="address" value={formData.address || ""} onChange={handleChange} placeholder="123 Street Name" className="rounded-lg border-gray-300" required />
                        </FieldWrapper>
                    </div>
                </div>
            </div>
        </div>
    );
}