"use client";

import { useState, useEffect } from "react";
import { useLeadStore, Lead } from "@/stores/useLeadStore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { validateEmail, validateMobile } from "@/lib/validation";
import ContactInformation, { ContactFormErrors } from "./contactInformation";
import ApplicationPreferences from "./applicationPreferences";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePartnerStore } from "@/stores/usePartnerStore";
import { isRestrictedToOwnLeads } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
} from "@heroui/react";

const initialState: Omit<Lead, "id" | "created_at"> = {
  name: "",
  email: "",
  mobile: "",
  type: "lead",
  preferred_country: "",
  preferred_course: "",
  status: "new",
  utm_source: "walkin",
  utm_medium: "",
  utm_campaign: "",
  assigned_to: null,
  created_by: null,
  reason: null,
  password: null,
  is_flagged: false,
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
  const { user } = useAuthStore();
  const partnerDetails = usePartnerStore((s) => s.currentPartner);

  useEffect(() => {
    if (isEditMode && lead) {
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        mobile: lead.mobile || "",
        type: lead.type || "lead",
        preferred_country: lead.preferred_country || "",
        preferred_course: lead.preferred_course || "",
        status: lead.status || "new",
        utm_source: lead.utm_source || "walkin",
        utm_medium: isRestrictedToOwnLeads(user?.permissions || []) ? partnerDetails?.name : "walkin",
        utm_campaign: isRestrictedToOwnLeads(user?.permissions || []) ? partnerDetails?.agency_name : "walkin",
        assigned_to: lead.assigned_to || null,
        created_by: lead?.created_by || null,
        reason: lead.reason || null,
        password: lead.password || null,
        is_flagged: lead.is_flagged || false,
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
          created_by: user?.id,
          utm_medium: isRestrictedToOwnLeads(user?.permissions || []) ? partnerDetails?.name : "walkin",
          utm_campaign: isRestrictedToOwnLeads(user?.permissions || []) ? partnerDetails?.agency_name : "walkin",
        };
        console.log("Creating lead with data:", leadData);
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
    <Drawer backdrop="blur" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false}>
      <DrawerContent className="sm:max-w-2xl w-full max-h-screen overflow-y-auto bg-background">
        {(onClose) => (
          <>
            <DrawerHeader className="px-6 pt-6 pb-3 border-b">
              <div className="text-xl font-semibold">
                {isEditMode ? "Edit Lead Details" : "Create a New Lead"}
              </div>
            </DrawerHeader>

            <DrawerBody className="px-6 py-6 space-y-8">
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
            </DrawerBody>

            <DrawerFooter className="px-6 py-4 border-t mt-auto bg-background">
              <div className="flex w-full items-center gap-3">
                <Button
                  variant="light"
                  onPress={onClose}
                  isDisabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleSubmit}
                  color="primary"
                  isDisabled={
                    loading ||
                    Object.values(errors).some((err) => err && err.length > 0)
                  }
                  startContent={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  className="text-white"
                >
                  {loading
                    ? isEditMode
                      ? "Saving..."
                      : "Creating..."
                    : isEditMode
                      ? "Save Changes"
                      : "Create Lead"}
                </Button>
              </div>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}