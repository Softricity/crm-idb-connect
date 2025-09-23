"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// @ts-ignore
import countryList from "react-select-country-list";
import { Lead } from "@/stores/useLeadStore";
import { Dispatch, SetStateAction, useState } from "react";

import { useAuthStore } from "@/stores/useAuthStore";

interface CountryOption {
  label: string;
  value: string;
}

interface ApplicationPreferencesProps {
  formData: Omit<Lead, "id" | "created_at">;
  setFormData: Dispatch<SetStateAction<Omit<Lead, "id" | "created_at">>>;
}

const countryOptions: CountryOption[] = countryList().getData();

export default function ApplicationPreferences({
  formData,
  setFormData,
}: ApplicationPreferencesProps) {
  const { user } = useAuthStore();
  const [isOther, setIsOther] = useState(false);

  const handleUtmChange = (value: string) => {
    if (value === "Other") {
      setIsOther(true);
      setFormData((prev) => ({ ...prev, utm_source: "" }));
    } else {
      setIsOther(false);
      setFormData((prev) => ({ ...prev, utm_source: value }));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Application Preferences</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border rounded-xl p-5 shadow-sm bg-card">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Applying for</Label>
          <Select
            value={formData.purpose || ""}
            onValueChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                purpose: value,
                preferred_country: value === "Study Abroad" ? prev.preferred_country : "",
              }));
            }}
          >
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue placeholder="Select IELTS, PTE, or Study Abroad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IELTS">IELTS</SelectItem>
              <SelectItem value="PTE">PTE</SelectItem>
              <SelectItem value="Study Abroad">Study Abroad</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.purpose === "Study Abroad" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preferred Country</Label>
            <Select
              value={formData.preferred_country || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, preferred_country: value }))
              }
            >
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {countryOptions.map((c) => (
                  <SelectItem key={c.value} value={c.label}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {user?.role === "agent" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Source</Label>
            <Select
              value={isOther ? "Other" : formData.utm_source || ""}
              onValueChange={handleUtmChange}
            >
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue placeholder="Select Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Walk-in">Walk-in</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Google Ads">Google Ads</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {user?.role === "agent" && isOther && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Other Source</Label>
            <input
              type="text"
              placeholder="Enter custom source"
              value={formData.utm_source || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, utm_source: e.target.value }))
              }
              className="w-full rounded-lg border p-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}