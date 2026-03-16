"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Textarea,
} from "@heroui/react";
import { SupportTicket, useSupportStore } from "@/stores/useSupportStore";

interface Props {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
  canReply: boolean;
  canUpdateStatus: boolean;
}

const statusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "AWAITING_REPLY", label: "Awaiting Reply" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
] as const;

export default function SupportTicketDetailModal({
  ticket,
  isOpen,
  onClose,
  canReply,
  canUpdateStatus,
}: Props) {
  const { selectedTicket, detailsLoading, fetchTicketById, addComment, updateStatus } = useSupportStore();
  const [replyMessage, setReplyMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && ticket?.id) {
      fetchTicketById(ticket.id);
    }
  }, [isOpen, ticket?.id, fetchTicketById]);

  const current = selectedTicket || ticket;

  const handleSendReply = async () => {
    if (!current?.id || !replyMessage.trim()) return;
    setSaving(true);
    try {
      await addComment(current.id, replyMessage.trim());
      setReplyMessage("");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!current?.id) return;
    setSaving(true);
    try {
      await updateStatus(current.id, status as SupportTicket["status"]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          {current ? `Ticket #${current.case_number}` : "Ticket Details"}
        </ModalHeader>
        <ModalBody>
          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : !current ? (
            <div className="py-8 text-center text-gray-500">Ticket not found.</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Subject:</span> {current.subject}</div>
                <div><span className="text-gray-500">Status:</span> {current.status.replace("_", " ")}</div>
                <div><span className="text-gray-500">Priority:</span> {current.priority}</div>
                <div><span className="text-gray-500">Created By:</span> {current.partner?.name || "-"}</div>
                <div><span className="text-gray-500">Topic:</span> {current.topic}</div>
                <div><span className="text-gray-500">Category:</span> {current.category}</div>
              </div>

              {canUpdateStatus && (
                <Select
                  label="Update Status"
                  selectedKeys={[current.status]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    if (value && value !== current.status) {
                      handleStatusChange(value);
                    }
                  }}
                  isDisabled={saving}
                >
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>
              )}

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="mb-1 text-sm font-medium text-gray-700">Description</p>
                <p className="whitespace-pre-wrap text-sm text-gray-600">{current.description}</p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Conversation</p>
                <div className="max-h-72 space-y-3 overflow-y-auto">
                  {(current.comments || []).map((comment) => (
                    <div key={comment.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-1 flex justify-between text-xs text-gray-500">
                        <span>{comment.sender_name} ({comment.sender_type})</span>
                        <span>{new Date(comment.created_at).toLocaleString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-gray-700">{comment.message}</p>
                    </div>
                  ))}
                  {!current.comments?.length && (
                    <div className="py-6 text-center text-sm text-gray-500">No messages yet.</div>
                  )}
                </div>
              </div>

              {canReply && (
                <div className="space-y-2">
                  <Textarea
                    label="Reply"
                    placeholder="Write your response..."
                    minRows={3}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    isDisabled={saving}
                  />
                  <div className="flex justify-end">
                    <Button
                      color="primary"
                      onPress={handleSendReply}
                      isDisabled={!replyMessage.trim()}
                      isLoading={saving}
                    >
                      Send Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
