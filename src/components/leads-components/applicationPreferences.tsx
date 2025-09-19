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
import { Dispatch, SetStateAction } from "react";

interface CountryOption {
  label: string;
  value: string;
}

// FIX: Props are updated to accept the main formData state object
interface ApplicationPreferencesProps {
  formData: Omit<Lead, "id" | "created_at">;
  setFormData: Dispatch<SetStateAction<Omit<Lead, "id" | "created_at">>>;
}

const countryOptions: CountryOption[] = countryList().getData();

export default function ApplicationPreferences({
  formData,
  setFormData,
}: ApplicationPreferencesProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Application Preferences</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border rounded-xl p-5 shadow-sm bg-card">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Applying for</Label>
          <Select
            // FIX: Value is now formData.purpose
            value={formData.purpose || ""}
            // FIX: Updates the parent's formData state
            onValueChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                purpose: value,
                // Also reset country if purpose is no longer 'Visa'
                preferred_country: value === "Visa" ? prev.preferred_country : "",
              }));
            }}
          >
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue placeholder="Select IELTS, PTE, or Visa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IELTS">IELTS</SelectItem>
              <SelectItem value="PTE">PTE</SelectItem>
              <SelectItem value="Visa">Visa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* FIX: Condition is now based on formData.purpose */}
        {formData.purpose === "Visa" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preferred Country</Label>
            <Select
              // FIX: Value is now formData.preferred_country
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
      </div>
    </div>
  );
}