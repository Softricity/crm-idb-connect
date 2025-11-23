"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { Branch, useBranchStore } from "@/stores/useBranchStore";
import { toast } from "sonner";
import { BranchesAPI } from "@/lib/api";

interface BranchFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch | null;
}

interface FormData {
  name: string;
  code: string;
  type: "HeadOffice" | "Regional" | "Branch";
  address: string;
  phone: string;
  parent_id: string;
}

const branchTypes = [
  { value: "HeadOffice", label: "Head Office" },
  { value: "Regional", label: "Regional Office" },
  { value: "Branch", label: "Local Branch" },
];

export function BranchFormDialog({ isOpen, onOpenChange, branch }: BranchFormDialogProps) {
  const { branches, fetchBranches } = useBranchStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    code: "",
    type: "Branch",
    address: "",
    phone: "",
    parent_id: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Reset form when dialog opens/closes or branch changes
  useEffect(() => {
    if (isOpen) {
      if (branch) {
        setFormData({
          name: branch.name || "",
          code: branch.code || "",
          type: branch.type || "Branch",
          address: branch.address || "",
          phone: branch.phone || "",
          parent_id: branch.parent_id || "",
        });
      } else {
        setFormData({
          name: "",
          code: "",
          type: "Branch",
          address: "",
          phone: "",
          parent_id: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, branch]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Branch name is required";
    }

    if (!formData.type) {
      newErrors.type = "Branch type is required";
    }

    // HeadOffice should not have a parent
    if (formData.type === "HeadOffice" && formData.parent_id) {
      newErrors.parent_id = "Head Office cannot have a parent branch";
    }

    // Phone validation (optional)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleTypeChange = (keys: any) => {
    const type = Array.from(keys)[0] as "HeadOffice" | "Regional" | "Branch";
    setFormData((prev) => ({ 
      ...prev, 
      type,
      // Clear parent_id if switching to HeadOffice
      parent_id: type === "HeadOffice" ? "" : prev.parent_id
    }));
    setErrors((prev) => ({ ...prev, type: "" }));
  };

  const handleParentChange = (keys: any) => {
    const parent_id = Array.from(keys)[0] as string;
    handleChange("parent_id", parent_id);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data
      const branchData = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        type: formData.type,
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        parent_id: formData.parent_id || null,
      };

      if (branch?.id) {
        // Update existing branch
        await BranchesAPI.updateBranch(branch.id, branchData);
        toast.success("Branch updated successfully");
      } else {
        // Create new branch
        await BranchesAPI.createBranch(branchData);
        toast.success("Branch created successfully");
      }

      // Refresh branches list
      await fetchBranches();
      
      // Close dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving branch:", error);
      toast.error(error.message || "Failed to save branch");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available parent branches (exclude current branch and its descendants)
  const availableParentBranches = branches.filter((b) => {
    // Exclude self
    if (branch?.id && b.id === branch.id) return false;
    
    // For HeadOffice type, no parents available
    if (formData.type === "HeadOffice") return false;
    
    // For Regional, only show HeadOffice as parent
    if (formData.type === "Regional") {
      return b.type === "HeadOffice";
    }
    
    // For Branch, show HeadOffice and Regional
    if (formData.type === "Branch") {
      return b.type === "HeadOffice" || b.type === "Regional";
    }
    
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {branch ? "Edit Branch" : "Create New Branch"}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {/* Branch Name */}
                <Input
                  label="Branch Name"
                  placeholder="Enter branch name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name}
                  isRequired
                  variant="bordered"
                />

                {/* Branch Code */}
                <Input
                  label="Branch Code"
                  placeholder="e.g., HO-001, REG-DEL, BR-MUM-01"
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  isInvalid={!!errors.code}
                  errorMessage={errors.code}
                  variant="bordered"
                  description="Optional: Unique identifier for the branch"
                />

                {/* Branch Type */}
                <Select
                  label="Branch Type"
                  placeholder="Select branch type"
                  selectedKeys={formData.type ? new Set([formData.type]) : new Set()}
                  onSelectionChange={handleTypeChange}
                  isInvalid={!!errors.type}
                  errorMessage={errors.type}
                  isRequired
                  variant="bordered"
                >
                  {branchTypes.map((type) => (
                    <SelectItem key={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </Select>

                {/* Parent Branch */}
                {formData.type !== "HeadOffice" && availableParentBranches.length > 0 && (
                  <Select
                    label="Parent Branch"
                    placeholder="Select parent branch (optional)"
                    selectedKeys={formData.parent_id ? new Set([formData.parent_id]) : new Set()}
                    onSelectionChange={handleParentChange}
                    isInvalid={!!errors.parent_id}
                    errorMessage={errors.parent_id}
                    variant="bordered"
                    description="Optional: Establish hierarchy by selecting a parent branch"
                  >
                    {availableParentBranches.map((b) => (
                      <SelectItem key={b.id}>
                        {b.name} ({b.type})
                      </SelectItem>
                    ))}
                  </Select>
                )}

                {/* Address */}
                <Textarea
                  label="Address"
                  placeholder="Enter branch address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  isInvalid={!!errors.address}
                  errorMessage={errors.address}
                  variant="bordered"
                  minRows={3}
                />

                {/* Phone */}
                <Input
                  label="Phone"
                  placeholder="Enter contact number"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  isInvalid={!!errors.phone}
                  errorMessage={errors.phone}
                  variant="bordered"
                  type="tel"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isSubmitting}
              >
                {branch ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
