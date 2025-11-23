"use client";

import { useEffect, useState } from "react";
import { useFollowupStore, Followup } from "@/stores/useFollowupStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Input,
  Spinner,
} from "@heroui/react";
import { Calendar, CheckCircle2, Clock, User, Mail } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function FollowUpsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { followups, loading, fetchAllFollowups, markComplete } = useFollowupStore();
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // Get today's date in YYYY-MM-DD format
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  useEffect(() => {
    if (user?.id) {
      // Fetch followups for current user and selected date
      fetchAllFollowups({ userId: user.id, date: selectedDate });
    }
  }, [user?.id, selectedDate, fetchAllFollowups]);

  const handleMarkComplete = async (followupId: string) => {
    try {
      await markComplete(followupId);
      toast.success("Follow-up marked as complete");
      // Refresh the list
      if (user?.id) {
        fetchAllFollowups({ userId: user.id, date: selectedDate });
      }
    } catch (error) {
      toast.error("Failed to mark follow-up as complete");
      console.error(error);
    }
  };

  const handleViewLead = (leadId: string) => {
    router.push(`/leads/${leadId}?tab=followups`);
  };

  const getStatusColor = (followup: Followup) => {
    if (followup.completed) return "success";
    
    if (followup.due_date) {
      const dueDate = new Date(followup.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) return "danger"; // Overdue
      if (dueDate.toDateString() === today.toDateString()) return "warning"; // Due today
    }
    
    return "default";
  };

  const getStatusText = (followup: Followup) => {
    if (followup.completed) return "Completed";
    
    if (followup.due_date) {
      const dueDate = new Date(followup.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) return "Overdue";
      if (dueDate.toDateString() === today.toDateString()) return "Due Today";
    }
    
    return "Pending";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Follow-ups</h1>
          <p className="mt-2 text-gray-600">
            View and manage your scheduled follow-ups
          </p>
        </div>

        {/* Date Filter */}
        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
              variant="bordered"
            />
            <Button
              size="sm"
              variant="flat"
              onPress={() => setSelectedDate(getTodayDate())}
            >
              Today
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!loading && followups.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Clock size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No follow-ups found
            </h3>
            <p className="text-gray-600">
              {selectedDate === getTodayDate()
                ? "You have no follow-ups scheduled for today"
                : `No follow-ups scheduled for ${formatDate(selectedDate)}`}
            </p>
          </div>
        )}

        {/* Follow-ups Table */}
        {!loading && followups.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table aria-label="Follow-ups table">
              <TableHeader>
                <TableColumn>TITLE</TableColumn>
                <TableColumn>LEAD</TableColumn>
                <TableColumn>DUE DATE</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn align="center">ACTIONS</TableColumn>
              </TableHeader>
              <TableBody items={followups}>
                {(followup) => (
                  <TableRow key={followup.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {followup.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <User size={14} className="text-gray-400" />
                          <span className="font-medium">
                            {followup.leads?.name || "Unknown"}
                          </span>
                        </div>
                        {followup.leads?.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Mail size={12} className="text-gray-400" />
                            <span>{followup.leads.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} />
                        {formatDate(followup.due_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getStatusColor(followup)}
                        variant="flat"
                      >
                        {getStatusText(followup)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => handleViewLead(followup.lead_id)}
                        >
                          View Lead
                        </Button>
                        {!followup.completed && (
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            startContent={<CheckCircle2 size={16} />}
                            onPress={() => handleMarkComplete(followup.id!)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && followups.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-2xl font-bold text-gray-900">
                {followups.length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Completed</div>
              <div className="text-2xl font-bold text-green-600">
                {followups.filter((f) => f.completed).length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-2xl font-bold text-orange-600">
                {followups.filter((f) => !f.completed).length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
