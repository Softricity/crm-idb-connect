"use client";

import React from "react";
import { useFollowupStore } from "@/stores/useFollowupStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Card, CardBody, Button, Textarea, Spinner, Input, Checkbox } from "@heroui/react";
import { format } from "date-fns";
import { Plus, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface CounsellorFollowupsProps {
  leadId: string;
}

export function CounsellorFollowups({ leadId }: CounsellorFollowupsProps) {
  const user = useAuthStore((state) => state.user);
  const { followups, loading, fetchFollowupsByLeadId, addFollowup, markComplete } = useFollowupStore();
  const [newFollowup, setNewFollowup] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

  React.useEffect(() => {
    if (leadId) {
      fetchFollowupsByLeadId(leadId);
    }
  }, [leadId, fetchFollowupsByLeadId]);

  const leadFollowups = React.useMemo(() => {
    return followups.filter((f) => f.lead_id === leadId);
  }, [followups, leadId]);

  const handleAddFollowup = async () => {
    if (!newFollowup.trim() || !dueDate) {
      toast.error("Please provide followup title and due date");
      return;
    }

    setIsAdding(true);
    try {
      await addFollowup({
        lead_id: leadId,
        title: newFollowup,
        due_date: dueDate,
        completed: false,
        created_by: user?.id || "",
      });
      toast.success("Follow-up added successfully");
      setNewFollowup("");
      setDueDate("");
      fetchFollowupsByLeadId(leadId);
    } catch (error) {
      toast.error("Failed to add follow-up");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      await markComplete(id);
      toast.success("Follow-up marked as complete");
      fetchFollowupsByLeadId(leadId);
    } catch (error) {
      toast.error("Failed to update follow-up");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full mt-6 space-y-6">
      {/* Add New Followup */}
      <Card>
        <CardBody className="space-y-4">
          <h3 className="text-lg font-semibold">Add New Follow-up</h3>
          <Input
            label="Follow-up Title"
            placeholder="Enter follow-up title..."
            value={newFollowup}
            onChange={(e) => setNewFollowup(e.target.value)}
          />
          <Input
            label="Due Date"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            startContent={<Calendar className="h-4 w-4 text-gray-400" />}
          />
          <div className="flex justify-end">
            <Button
              color="primary"
              onPress={handleAddFollowup}
              isLoading={isAdding}
              startContent={<Plus className="h-4 w-4" />}
            >
              Add Follow-up
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Followup List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Follow-up History</h3>
        {leadFollowups.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-center text-gray-500">No follow-ups yet</p>
            </CardBody>
          </Card>
        ) : (
          leadFollowups.map((followup) => (
            <Card key={followup.id}>
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      isSelected={followup.completed}
                      onValueChange={() => handleToggleComplete(followup.id!)}
                      size="sm"
                    />
                    <div>
                      <p className={`font-medium ${followup.completed ? "line-through text-gray-400" : ""}`}>
                        {followup.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Due: {followup.due_date
                            ? format(new Date(followup.due_date), "PPp")
                            : "No date"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      followup.completed
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {followup.completed ? "Completed" : "Pending"}
                  </span>
                </div>
                {followup.created_at && (
                  <p className="text-xs text-gray-400">
                    Created: {format(new Date(followup.created_at), "PPP")}
                  </p>
                )}
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
