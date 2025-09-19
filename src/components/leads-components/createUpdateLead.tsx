"use client";

import { useState, useEffect } from "react";
import { useLeadStore, Lead } from "@/stores/useLeadStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { validateEmail, validateMobile } from "@/lib/validation";
import ContactInformation, { ContactFormErrors } from "./contactInformation";
import ApplicationPreferences from "./applicationPreferences";

// FIX: This state now matches the Lead type from useLeadStore.ts exactly.
// Fields like 'address', 'qualifications', etc., have been removed or renamed.
const initialState: Omit<Lead, "id" | "created_at"> = {
  name: "",
  mobile: "",
  email: "",
  alternate_mobile: "",
  city: "",
  purpose: "", // Added 'purpose' field
  preferred_country: "", // Renamed from 'preferredcountry'
  status: "new",
  type: "student",
  utm_source: "walkin", // Renamed from 'utmsource'
  utm_medium: "", // Renamed from 'utmmedium'
  utm_campaign: "", // Renamed from 'utmcampaign'
  assigned_to: null, // Renamed from 'assignedto'
};

interface LeadFormSheetProps {
  lead?: Lead | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function LeadFormSheet({ lead, isOpen, onOpenChange }: LeadFormSheetProps) {
  const isEditMode = !!lead;
  const { addLead, updateLead } = useLeadStore();

  // FIX: Unified state for all form data.
  const [formData, setFormData] = useState<Omit<Lead, "id" | "created_at">>(initialState);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && lead) {
      // FIX: Ensure all fields from the lead object are mapped correctly to the form state.
      // Added || "" to prevent React uncontrolled component warnings for null values.
      setFormData({
        name: lead.name || "",
        mobile: lead.mobile || "",
        email: lead.email || "",
        alternate_mobile: lead.alternate_mobile || "",
        city: lead.city || "",
        purpose: lead.purpose || "",
        preferred_country: lead.preferred_country || "",
        status: lead.status || "new",
        type: lead.type || "student",
        utm_source: lead.utm_source || "walkin",
        utm_medium: lead.utm_medium || "",
        utm_campaign: lead.utm_campaign || "",
        assigned_to: lead.assigned_to || null,
      });
    } else {
      setFormData(initialState);
    }
  }, [lead, isEditMode, isOpen]);

  const handleSubmit = async () => {
    setLoading(true);
    const newErrors: ContactFormErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!validateEmail(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.mobile) newErrors.mobile = "Mobile is required";
    else if (!validateMobile(formData.mobile)) newErrors.mobile = "Invalid mobile number";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      // FIX: The formData object now correctly matches the type expected by the store functions.
      if (isEditMode && lead?.id) {
        await updateLead(lead.id, formData);
        toast.success("Lead updated successfully!");
      } else {
        await addLead(formData);
        toast.success("Lead created successfully!");
      }
      onOpenChange(false);
    } catch {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} lead.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="text-xl font-semibold">
            {isEditMode ? "Edit Lead Details" : "Create a New Lead"}
          </SheetTitle>
          <SheetDescription>
            {isEditMode ? `Update the details for ${lead?.name}.` : "Enter details below to add a new lead."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto px-6 py-6 space-y-8">
          <ContactInformation
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />
          <ApplicationPreferences
            formData={formData}
            setFormData={setFormData}
          />
        </div>

        <SheetFooter className="p-6 border-t bg-background mt-auto">
          <div className="flex w-full items-center gap-3">
            <SheetClose asChild>
              <Button variant="outline" disabled={loading}>
                Cancel
              </Button>
            </SheetClose>
            <Button
              onClick={handleSubmit}
              disabled={loading || Object.values(errors).some((err) => err && err.length > 0)}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Lead"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}