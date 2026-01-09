"use client";

import { useState, useEffect } from "react";
import { useAnnouncementStore } from "@/stores/useAnnouncementStore";
import { usePartnerStore } from "@/stores/usePartnerStore"; 
import { useBranchStore } from "@/stores/useBranchStore"; // ✅ Import Branch Store
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ChevronsUpDown } from "lucide-react";

type TargetAudience = "user" | "branch";

export default function CreateAnnouncementDialog() {
  const [open, setOpen] = useState(false);
  const { createAnnouncement } = useAnnouncementStore();
  const { partners, fetchPartners } = usePartnerStore();
  const { selectedBranch } = useBranchStore(); // ✅ Get selected branch
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    target_audience: TargetAudience;
    users: string[];
  }>({
    title: "",
    content: "",
    target_audience: "branch", 
    users: [],
  });

  useEffect(() => {
    if (open) {
        fetchPartners(selectedBranch?.id);
    }
  }, [fetchPartners, selectedBranch, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAnnouncement(formData);
      setOpen(false);
      setFormData({ title: "", content: "", target_audience: "branch", users: [] });
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} /> New Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              required
              placeholder="e.g., System Maintenance"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Select
              value={formData.target_audience}
              onValueChange={(val: TargetAudience) => setFormData({ ...formData, target_audience: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="branch">Branch Wide</SelectItem>
                <SelectItem value="user">Specific Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.target_audience === "user" && (
            <div className="space-y-2">
              <Label>Select Users</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {formData.users.length > 0
                      ? `${formData.users.length} user(s) selected`
                      : "Select users..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                    {partners.map((partner) => (
                      <div
                        key={partner.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                        onClick={() => partner.id && toggleUser(partner.id)}
                      >
                        <Checkbox
                          checked={partner.id ? formData.users.includes(partner.id) : false}
                          onCheckedChange={() => partner.id && toggleUser(partner.id)}
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{partner.name}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{partner.email}</span>
                                {/* ✅ Show Role Badge */}
                                <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-700 capitalize">
                                    {partner.role}
                                </span>
                            </div>
                        </div>
                      </div>
                    ))}
                    {partners.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-500">
                            No users found in {selectedBranch?.name || "this branch"}.
                        </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              required
              placeholder="Enter details..."
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Posting..." : "Post Announcement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}