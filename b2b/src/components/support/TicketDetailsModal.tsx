"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Select,
  SelectItem,
  Textarea,
  Spinner,
  Divider,
} from "@heroui/react";
import { format } from "date-fns";
import { SupportAPI } from "@/lib/api";
import { Ticket } from "./SupportTicketsTable";

interface Comment {
  id: string;
  sender_type: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface TicketWithComments extends Ticket {
  comments?: Comment[];
}

interface TicketDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  isAdmin: boolean;
}

const statusColorMap: {
  [key: string]: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
} = {
  OPEN: "primary",
  IN_PROGRESS: "warning",
  AWAITING_REPLY: "secondary",
  RESOLVED: "success",
  CLOSED: "default",
};

const priorityColorMap: {
  [key: string]: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
} = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
  URGENT: "danger",
};

export default function TicketDetailsModal({ 
  isOpen, 
  onClose, 
  ticket: initialTicket, 
  isAdmin 
}: TicketDetailsModalProps) {
  const [ticket, setTicket] = useState<TicketWithComments | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTicketDetails();
    }
  }, [isOpen, initialTicket.id]);

  const fetchTicketDetails = async () => {
    setLoading(true);
    try {
      const data = await SupportAPI.getTicketById(initialTicket.id);
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      await SupportAPI.addComment(ticket.id, replyMessage);
      setReplyMessage('');
      await fetchTicketDetails();
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!ticket) return;

    setUpdatingStatus(true);
    try {
      await SupportAPI.updateStatus(ticket.id, newStatus);
      await fetchTicketDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusOptions = [
    { value: "OPEN", label: "Open" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "AWAITING_REPLY", label: "Awaiting Reply" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Loading ticket details...</span>
                </div>
              ) : ticket ? (
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold">Ticket #{ticket.case_number}</h2>
                      <p className="text-base font-normal text-gray-600 mt-1">{ticket.subject}</p>
                    </div>
                    {isAdmin && (
                      <Select
                        size="sm"
                        selectedKeys={[ticket.status]}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as string;
                          handleUpdateStatus(value);
                        }}
                        isDisabled={updatingStatus}
                        className="w-48"
                      >
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Chip
                      color={statusColorMap[ticket.status] || "default"}
                      size="sm"
                      variant="flat"
                    >
                      {ticket.status.replace('_', ' ')}
                    </Chip>
                    <Chip
                      color={priorityColorMap[ticket.priority] || "default"}
                      size="sm"
                      variant="flat"
                    >
                      {ticket.priority}
                    </Chip>
                  </div>
                </div>
              ) : (
                <span>Ticket Details</span>
              )}
            </ModalHeader>
            <ModalBody>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : ticket ? (
                <div className="space-y-4">
                  {/* Ticket Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Topic:</span>
                      <span className="ml-2 font-medium">{ticket.topic}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-2 font-medium">{ticket.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created By:</span>
                      <span className="ml-2 font-medium">{ticket.partner?.name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(ticket.created_at), "dd MMM yyyy, HH:mm")}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Description:</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
                  </div>

                  <Divider />

                  {/* Conversation */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Conversation</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4">
                      {ticket.comments && ticket.comments.length > 0 ? (
                        ticket.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className={`p-4 rounded-lg ${
                              comment.sender_type === 'PARTNER'
                                ? 'bg-blue-50 ml-auto max-w-[85%]'
                                : 'bg-gray-100 mr-auto max-w-[85%]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {comment.sender_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(comment.created_at), "dd MMM, HH:mm")}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {comment.message}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8">No replies yet</p>
                      )}
                    </div>

                    {/* Reply Form */}
                    <form onSubmit={handleSendReply} className="space-y-3">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        minRows={3}
                        isDisabled={sendingReply}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          color="primary"
                          isLoading={sendingReply}
                          isDisabled={!replyMessage.trim()}
                        >
                          Send Reply
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Failed to load ticket details</p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
