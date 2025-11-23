"use client";

import { Select, SelectItem } from "@heroui/react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBranchStore } from "@/stores/useBranchStore";
import { useEffect } from "react";
import { isSuperAdmin } from "@/lib/utils";

interface BranchSelectorProps {
  value?: string;
  onChange?: (branchId: string) => void;
  className?: string;
  label?: string;
  placeholder?: string;
}

export default function BranchSelector({
  value,
  onChange,
  className = "",
}: BranchSelectorProps) {
  const { user } = useAuthStore();
  const { branches, fetchBranches, selectedBranch, setSelectedBranch } = useBranchStore();

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Permission checks
  const permissions = user?.permissions || [];
  const isUserSuperAdmin = permissions.length ? isSuperAdmin(permissions) : false;
  const canManageBranches = permissions.includes("Branch Manage");

  // Disabled if user lacks Branch Manage permission and is not super admin
  const isDisabled = !(canManageBranches || isUserSuperAdmin);

  // Get current value
  const currentValue = value || user?.branch_id || "";

  // Handle selection change
  const handleChange = (keys: any) => {
    const branchId = Array.from(keys)[0] as string;
    if (!branchId) return;
    
    const branch = branches.find((b) => b.id === branchId);
    
    if (branch) {
      setSelectedBranch(branch);
    }
    
    if (onChange) {
      onChange(branchId);
    }
  };

  // Set initial selected branch if user has a branch
  useEffect(() => {
    if (user?.branch_id && branches.length > 0) {
      const userBranch = branches.find((b) => b.id === user.branch_id);
      if (userBranch && !selectedBranch) {
        setSelectedBranch(userBranch);
      }
    }
  }, [user?.branch_id, branches, selectedBranch, setSelectedBranch]);

  // If disabled, only show the user's assigned branch (prevent viewing others)
  const visibleBranches = isDisabled
    ? branches.filter((b) => b.id === user?.branch_id)
    : branches;

  return (
    <Select
      label="Branch"
      placeholder={isDisabled ? (user?.branch_name || "Branch") : "Select branch"}
      selectedKeys={currentValue ? new Set([currentValue]) : new Set()}
      onSelectionChange={handleChange}
      isDisabled={isDisabled}
      className={className}
      variant="bordered"
      description={
        isDisabled
          ? canManageBranches
            ? undefined
            : user?.branch_name
              ? `Locked to ${user.branch_name} (no permission)`
              : `No branch assigned`
          : undefined
      }
    >
      {visibleBranches.map((branch) => (
        <SelectItem key={branch.id}>
          {[branch.name, branch.code ? `- (${branch.code})` : null, branch.type]
            .filter(Boolean)
            .join(" ")}
        </SelectItem>
      ))}
    </Select>
  );
}
