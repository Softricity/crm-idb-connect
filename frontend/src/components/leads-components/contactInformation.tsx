"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateEmail, validateMobile, validateName } from "@/lib/validation";
import PhoneInput, { Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Dispatch, SetStateAction } from "react";
import { Lead } from "@/stores/useLeadStore";

export interface ContactFormErrors {
  name?: string;
  email?: string;
  mobile?: string;
}

interface ContactInformationProps {
  formData: Omit<Lead, "id" | "created_at">;
  setFormData: Dispatch<SetStateAction<Omit<Lead, "id" | "created_at">>>;
  errors: ContactFormErrors;
  setErrors: Dispatch<SetStateAction<ContactFormErrors>>;
}

const ErrorText = ({ message }: { message?: string }) =>
  message ? <span className="text-xs text-red-500 mt-1">{message}</span> : null;

export default function ContactInformation({
  formData,
  setFormData,
  errors,
  setErrors,
}: ContactInformationProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contact Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-lg">
        {/* Full Name */}
        <div className="flex flex-col gap-1">
          <Label>Full Name*</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({ ...prev, name: val }));
              const errorMsg = validateName(val);
              setErrors((prev) => ({ ...prev, name: errorMsg }));
            }}
          />
          <ErrorText message={errors.name} />
        </div>

        {/* Mobile */}
        <div className="flex flex-col gap-1">
          <Label>Mobile Number*</Label>
          <PhoneInput
            international
            defaultCountry="IN"
            value={formData.mobile as Value}
            onChange={(value) => {
              const newValue = value || "";
              setFormData((prev) => ({ ...prev, mobile: newValue }));
              setErrors((prev) => ({
                ...prev,
                mobile: validateMobile(newValue) ? "" : "Invalid mobile number",
              }));
            }}
            className="border rounded-md p-2"
          />
          <ErrorText message={errors.mobile} />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <Label>Email Address*</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({ ...prev, email: val }));
              setErrors((prev) => ({
                ...prev,
                email: validateEmail(val) ? "" : "Invalid email format",
              }));
            }}
          />
          <ErrorText message={errors.email} />
        </div>
      </div>
    </div>
  );
}
