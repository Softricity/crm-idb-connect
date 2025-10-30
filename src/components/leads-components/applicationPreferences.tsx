"use client";

import {
  Select,
  SelectItem,
  Input,
} from "@heroui/react";
// @ts-ignore
import countryList from "react-select-country-list";
import { Lead } from "@/stores/useLeadStore";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePartnerStore } from "@/stores/usePartnerStore";
import { Label } from "../ui/label";

interface ApplicationPreferencesProps {
  formData: Omit<Lead, "id" | "created_at">;
  setFormData: Dispatch<SetStateAction<Omit<Lead, "id" | "created_at">>>;
}

const countryOptions = countryList().getData();

export default function ApplicationPreferences({
  formData,
  setFormData,
}: ApplicationPreferencesProps) {
  const { user } = useAuthStore();
  const { partners, fetchPartners } = usePartnerStore();
  const [isOther, setIsOther] = useState(formData.utm_source === "");

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const counsellors = partners.filter((p) => p.role === "counsellor");

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
            placeholder="Select IELTS, PTE, or Study Abroad"
            selectedKeys={new Set([formData.purpose])}
            onChange={(e) => {
              const value = e.target.value;
              setFormData((prev) => ({
                ...prev,
                purpose: value,
                preferred_country: value === "Study Abroad" ? prev.preferred_country : "",
              }));
            }}
          >
            <SelectItem key="IELTS">IELTS</SelectItem>
            <SelectItem key="PTE">PTE</SelectItem>
            <SelectItem key="Study Abroad">Study Abroad</SelectItem>
          </Select>
        </div>

        {formData.purpose === "Study Abroad" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preferred Country</Label>
            <Select
              placeholder="Select Country"
              selectedKeys={new Set([formData.preferred_country ?? ""])}
              className="max-h-64"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, preferred_country: e.target.value }))
              }
            >
              {countryOptions.map((country : any) => (
                <SelectItem key={country.label}>{country.label}</SelectItem>
              ))}
            </Select>
          </div>
        )}

        {user?.role === "admin" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Assign to Counsellor</Label>
            <Select
              placeholder="Select Counsellor"
              selectedKeys={new Set(formData.assigned_to ? [formData.assigned_to] : [])}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, assigned_to: e.target.value || null }))
              }
            >
              <SelectItem key="">Unassigned</SelectItem>
              {counsellors.map((counsellor) => (
                <SelectItem key={counsellor.id!}>
                  {counsellor.name} ({counsellor.email})
                </SelectItem>
              ))}
            </Select>
          </div>
        )}

        {user?.role === "agent" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Source</Label>
            <Select
              placeholder="Select Source"
              selectedKeys={
                new Set([
                  isOther
                    ? "Other"
                    : formData.utm_source
                    ? formData.utm_source
                    : ""
                ])
              }
              onChange={(e) => handleUtmChange(e.target.value)}
            >
              <SelectItem key="Instagram">Instagram</SelectItem>
              <SelectItem key="WhatsApp">WhatsApp</SelectItem>
              <SelectItem key="Walk-in">Walk-in</SelectItem>
              <SelectItem key="Facebook">Facebook</SelectItem>
              <SelectItem key="Referral">Referral</SelectItem>
              <SelectItem key="Website">Website</SelectItem>
              <SelectItem key="Google Ads">Google Ads</SelectItem>
              <SelectItem key="Other">Other</SelectItem>
            </Select>
          </div>
        )}

        {user?.role === "agent" && isOther && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Other Source</Label>
            <Input
              placeholder="Enter custom source"
              value={formData.utm_source || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, utm_source: e.target.value }))
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
