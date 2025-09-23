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
import { useAuthStore } from "@/stores/useAuthStore";
import { usePartnerStore } from "@/stores/usePartnerStore";

const initialState: Omit<Lead, "id" | "created_at"> = {
  name: "",
  mobile: "",
  email: "",
  alternate_mobile: "",
  city: "",
  purpose: "",
  preferred_country: "",
  status: "new",
  type: "student",
  utm_source: "walkin",
  utm_medium: "",
  utm_campaign: "",
  assigned_to: null,
  created_by: null
};

interface LeadFormSheetProps {
  lead?: Lead | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function LeadFormSheet({ lead, isOpen, onOpenChange }: LeadFormSheetProps) {
  const isEditMode = !!lead;
  const { addLead, updateLead } = useLeadStore();
  const [formData, setFormData] = useState<Omit<Lead, "id" | "created_at">>(initialState);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [loading, setLoading] = useState(false);
  const partnerDetails = usePartnerStore((s) => s.currentPartner);

  function fun() {
    console.log(partnerDetails)
  }

  const { user } = useAuthStore();
  useEffect(() => {
    if (isEditMode && lead) {
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
        utm_medium: user?.role !== "agent" ? "walkin" : partnerDetails?.name,
        utm_campaign: user?.role !== "agent" ? "walkin" : partnerDetails?.agency_name,
        assigned_to: lead.assigned_to || null,
        created_by: user?.role === "admin" ? null : user?.id,
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
      if (isEditMode && lead?.id) {
        await updateLead(lead.id, formData);
        toast.success("Lead updated successfully!");
      } else {
        const leadData = {
          ...formData,
          created_by: user?.role === "admin" ? null : user?.id,
          utm_medium: user?.role !== "agent" ? "walkin" : partnerDetails?.name,
          utm_campaign: user?.role !== "agent" ? "walkin" : partnerDetails?.agency_name,
        };
        await addLead(leadData);
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
            <button onClick={fun}>fun</button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}