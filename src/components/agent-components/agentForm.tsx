"use client";

import { format } from "date-fns";
import { CalendarIcon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import PhoneInputWithCountrySelect, { Value } from "react-phone-number-input";
import { Partner } from "@/stores/usePartnerStore"; 


type PartnerFormData = Omit<
    Partner,
    "association_date" | "agreement_start_date" | "agreement_end_date"
> & {
    association_date?: Date;
    agreement_start_date?: Date;
    agreement_end_date?: Date;
};

interface AgentFormFieldsProps {
    formData: Partial<PartnerFormData>; 
    errors: Partial<Record<keyof PartnerFormData, string>>; 
    isSubmitting: boolean;
    showPassword: boolean;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handlePhoneChange: (value: Value | undefined) => void;
    handleSelectChange: (value: string) => void;
    handleDateChange: (name: keyof PartnerFormData, date: Date | undefined) => void; 
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

export function AgentFormFields({
    formData,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    handleChange,
    handlePhoneChange,
    handleSelectChange,
    handleDateChange,
}: AgentFormFieldsProps) {
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
                    Agency Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { label: "Agency Name", name: "agency_name", placeholder: "" },
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

            <div className="space-y-6 rounded-xl border p-6 shadow-sm bg-white hover:shadow-md transition">
                <h3 className="text-lg font-medium text-gray-800 border-b pb-2">
                    Agreement Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FieldWrapper label="Association Type" name="association_type" errors={errors}>
                        <Select
                            value={formData.association_type ?? undefined}
                            onValueChange={handleSelectChange}
                        >
                            <SelectTrigger className="rounded-lg focus:ring-2 focus:ring-primary/70 border-gray-300">
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Full-time">Full-time</SelectItem>
                                <SelectItem value="Part-time">Part-time</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                            </SelectContent>
                        </Select>
                    </FieldWrapper>

                    {[
                        { label: "Association Date", key: "association_date" },
                        { label: "Agreement Start Date", key: "agreement_start_date" },
                        { label: "Agreement End Date", key: "agreement_end_date" },
                    ].map((field) => (
                        <FieldWrapper
                            key={field.key}
                            label={field.label}
                            name={field.key as keyof PartnerFormData} 
                            errors={errors}
                        >
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-between rounded-lg focus:ring-2 focus:ring-primary/70 border-gray-300",
                                            !(formData as any)[field.key] && "text-gray-400"
                                        )}
                                    >
                                        {(formData as any)[field.key]
                                            ? format((formData as any)[field.key], "PPP")
                                            : "Pick a date"}
                                        <CalendarIcon className="h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={(formData as any)[field.key]}
                                        onSelect={(date) =>
                                            handleDateChange(field.key as keyof PartnerFormData, date) 
                                        }
                                    />
                                </PopoverContent>
                            </Popover>
                        </FieldWrapper>
                    ))}
                </div>
            </div>
        </div>
    );
}