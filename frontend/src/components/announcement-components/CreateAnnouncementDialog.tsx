"use client";

import { useState, useEffect } from "react";
import { useAnnouncementStore } from "@/stores/useAnnouncementStore";
import { usePartnerStore } from "@/stores/usePartnerStore"; 
import { useBranchStore } from "@/stores/useBranchStore";
import api from "@/lib/api";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
  Chip,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { Plus, ChevronsUpDown } from "lucide-react";

type TargetAudience = "user" | "branch" | "branch-specific" | "role-based";

interface Role {
  id: string;
  name: string;
  description?: string;
}

export default function CreateAnnouncementDialog() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { createAnnouncement } = useAnnouncementStore();
  const { partners, fetchPartners } = usePartnerStore();
  const { selectedBranch, branches, fetchBranches } = useBranchStore();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    target_audience: TargetAudience;
    users: string[];
    branches: string[];
    roles: string[];
  }>({
    title: "",
    content: "",
    target_audience: "branch", 
    users: [],
    branches: [],
    roles: [],
  });

  useEffect(() => {
    if (isOpen) {
        fetchPartners(selectedBranch?.id);
        fetchBranches();
        // Fetch roles from backend
        api.RolesAPI.getAll()
          .then((data) => setRoles(data as Role[]))
          .catch((error) => console.error('Error fetching roles:', error));
    }
  }, [fetchPartners, fetchBranches, selectedBranch, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAnnouncement(formData);
      onOpenChange();
      setFormData({ 
        title: "", 
        content: "", 
        target_audience: "branch", 
        users: [], 
        branches: [], 
        roles: [] 
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setFormData((prev) => {
      const isSelected = prev.users.includes(userId);
      return {
        ...prev,
        users: isSelected
          ? prev.users.filter((id) => id !== userId)
          : [...prev.users, userId],
      };
    });
  };

  const toggleBranch = (branchId: string) => {
    setFormData((prev) => {
      const isSelected = prev.branches.includes(branchId);
      return {
        ...prev,
        branches: isSelected
          ? prev.branches.filter((id) => id !== branchId)
          : [...prev.branches, branchId],
      };
    });
  };

  const toggleRole = (roleName: string) => {
    setFormData((prev) => {
      const isSelected = prev.roles.includes(roleName);
      return {
        ...prev,
        roles: isSelected
          ? prev.roles.filter((r) => r !== roleName)
          : [...prev.roles, roleName],
      };
    });
  };

  return (
    <>
      <Button 
        color="primary"
        startContent={<Plus size={16} />}
        onPress={onOpen}
      >
        New Announcement
      </Button>
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit}>
              <ModalHeader className="flex flex-col gap-1">
                Create Announcement
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Title"
                  placeholder="e.g., System Maintenance"
                  value={formData.title}
                  onValueChange={(value) => setFormData({ ...formData, title: value })}
                  isRequired
                  variant="bordered"
                />

                <Select
                  label="Target Audience"
                  placeholder="Select audience"
                  selectedKeys={[formData.target_audience]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as TargetAudience;
                    setFormData({ ...formData, target_audience: selected });
                  }}
                  variant="bordered"
                >
                  <SelectItem key="branch">All Branches</SelectItem>
                  <SelectItem key="branch-specific">Specific Branches</SelectItem>
                  <SelectItem key="role-based">Role Based</SelectItem>
                  <SelectItem key="user">Specific Users</SelectItem>
                </Select>

                {formData.target_audience === "branch-specific" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Select Branches</label>
                    <Popover placement="bottom" showArrow>
                      <PopoverTrigger>
                        <Button
                          variant="bordered"
                          className="justify-between"
                          endContent={<ChevronsUpDown size={16} />}
                        >
                          {formData.branches.length > 0
                            ? `${formData.branches.length} branch(es) selected`
                            : "Select branches..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                          {branches.map((branch) => (
                            <div
                              key={branch.id}
                              className="flex items-center space-x-2 p-2 hover:bg-default-100 rounded-md cursor-pointer"
                              onClick={() => toggleBranch(branch.id)}
                            >
                              <Checkbox
                                isSelected={formData.branches.includes(branch.id)}
                                onValueChange={() => toggleBranch(branch.id)}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{branch.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-default-500">{branch.code}</span>
                                  <Chip size="sm" variant="flat" className="capitalize">
                                    {branch.type}
                                  </Chip>
                                </div>
                              </div>
                            </div>
                          ))}
                          {branches.length === 0 && (
                            <div className="p-4 text-center text-sm text-default-500">
                              No branches available.
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {formData.target_audience === "role-based" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Select Roles</label>
                    <Popover placement="bottom" showArrow>
                      <PopoverTrigger>
                        <Button
                          variant="bordered"
                          className="justify-between"
                          endContent={<ChevronsUpDown size={16} />}
                        >
                          {formData.roles.length > 0
                            ? `${formData.roles.length} role(s) selected`
                            : "Select roles..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                          {roles.map((role) => (
                            <div
                              key={role.id}
                              className="flex items-center space-x-2 p-2 hover:bg-default-100 rounded-md cursor-pointer"
                              onClick={() => toggleRole(role.name.toLowerCase())}
                            >
                              <Checkbox
                                isSelected={formData.roles.includes(role.name.toLowerCase())}
                                onValueChange={() => toggleRole(role.name.toLowerCase())}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium capitalize">{role.name}</span>
                                {role.description && (
                                  <span className="text-xs text-default-500">{role.description}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {roles.length === 0 && (
                            <div className="p-4 text-center text-sm text-default-500">
                              No roles available.
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {formData.target_audience === "user" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Select Users</label>
                    <Popover placement="bottom" showArrow>
                      <PopoverTrigger>
                        <Button
                          variant="bordered"
                          className="justify-between"
                          endContent={<ChevronsUpDown size={16} />}
                        >
                          {formData.users.length > 0
                            ? `${formData.users.length} user(s) selected`
                            : "Select users..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                          {partners.map((partner) => (
                            <div
                              key={partner.id}
                              className="flex items-center space-x-2 p-2 hover:bg-default-100 rounded-md cursor-pointer"
                              onClick={() => partner.id && toggleUser(partner.id)}
                            >
                              <Checkbox
                                isSelected={partner.id ? formData.users.includes(partner.id) : false}
                                onValueChange={() => partner.id && toggleUser(partner.id)}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{partner.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-default-500">{partner.email}</span>
                                  <Chip size="sm" variant="flat" className="capitalize">
                                    {partner.role}
                                  </Chip>
                                </div>
                              </div>
                            </div>
                          ))}
                          {partners.length === 0 && (
                            <div className="p-4 text-center text-sm text-default-500">
                              No users found in {selectedBranch?.name || "this branch"}.
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <Textarea
                  label="Content"
                  placeholder="Enter details..."
                  minRows={4}
                  value={formData.content}
                  onValueChange={(value) => setFormData({ ...formData, content: value })}
                  isRequired
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  type="submit"
                  isLoading={loading}
                >
                  {loading ? "Posting..." : "Post Announcement"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}