"use client";

import React, { useState } from "react";
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
import { SupportAPI } from "@/lib/api";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
    topics?: string[];
    categories?: string[];
}

export default function CreateTicketModal({ isOpen, onClose, onSuccess, topics, categories }: CreateTicketModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    category: '',
    subject: '',
    description: '',
    priority: 'MEDIUM',
  });

  const topicOptions = topics ? topics.map(topic => ({ value: (topic as any).value, label: (topic as any).label })) : [
    { value: "Agent Portal Management", label: "Agent Portal Management" },
    { value: "Commission & Payments", label: "Commission & Payments" },
    { value: "Application Status", label: "Application Status" },
    { value: "Technical Support", label: "Technical Support" },
    { value: "Account Issues", label: "Account Issues" },
    { value: "Other", label: "Other" },
  ];

  const categoryOptions = categories ? categories.map(category => ({ value: (category as any).value, label: (category as any).label })) : [
    { value: "Bank Details Upload", label: "Bank Details Upload" },
    { value: "Commission Query", label: "Commission Query" },
    { value: "Login Issues", label: "Login Issues" },
    { value: "Bug Report", label: "Bug Report" },
    { value: "Feature Request", label: "Feature Request" },
    { value: "General Inquiry", label: "General Inquiry" },
  ];

  const priorityOptions = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await SupportAPI.createTicket(formData);
      setFormData({
        topic: '',
        category: '',
        subject: '',
        description: '',
        priority: 'MEDIUM',
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        topic: '',
        category: '',
        subject: '',
        description: '',
        priority: 'MEDIUM',
      });
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
      isDismissable={!loading}
      hideCloseButton={loading}
    >
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col gap-1">
              Create New Support Ticket
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Select
                  label="Topic"
                  placeholder="Select a topic"
                  isRequired
                  selectedKeys={formData.topic ? [formData.topic] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setFormData({ ...formData, topic: value });
                  }}
                  isDisabled={loading}
                >
                  {topicOptions.map((option) => (
                    <SelectItem key={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Category"
                  placeholder="Select a category"
                  isRequired
                  selectedKeys={formData.category ? [formData.category] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setFormData({ ...formData, category: value });
                  }}
                  isDisabled={loading}
                >
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Priority"
                  placeholder="Select priority"
                  selectedKeys={[formData.priority]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setFormData({ ...formData, priority: value });
                  }}
                  isDisabled={loading}
                >
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  label="Subject"
                  placeholder="Brief description of your issue"
                  isRequired
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  isDisabled={loading}
                />

                <Textarea
                  label="Description"
                  placeholder="Provide detailed information about your issue..."
                  isRequired
                  minRows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  isDisabled={loading}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                color="danger" 
                variant="light" 
                onPress={handleClose}
                isDisabled={loading}
              >
                Cancel
              </Button>
              <Button 
                color="primary" 
                type="submit"
                isLoading={loading}
              >
                Create Ticket
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
