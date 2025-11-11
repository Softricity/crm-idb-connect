"use client";

import React, { useMemo, useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Select,
    SelectItem,
    Textarea,
    Progress,
} from "@heroui/react";
import { Lead } from "@/stores/useLeadStore";
import { MessageSquare } from "lucide-react";

interface BulkCommunicationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedLeadIds: string[];
    allLeads: Lead[];
    onComplete: () => void;
}

export default function BulkCommunicationModal({
    isOpen,
    onOpenChange,
    selectedLeadIds,
    allLeads,
    onComplete,
}: BulkCommunicationModalProps) {
    const [actionType, setActionType] = useState("");
    const [message, setMessage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentIndex] = useState(0); // progress reserved

    const selectedLeads = useMemo(
        () => allLeads.filter((l) => selectedLeadIds.includes(l.id || "")),
        [allLeads, selectedLeadIds]
    );

    const canSend = !!actionType && message.trim().length > 0;

    const handleComplete = () => {
        onComplete();
        onOpenChange(false);
        setActionType("");
        setMessage("");
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!isProcessing) onOpenChange(open);
            }}
            isDismissable={!isProcessing}
            isKeyboardDismissDisabled={isProcessing}
            hideCloseButton={isProcessing}
            size="md"
            classNames={{ base: "max-w-xl" }}
        >
            <ModalContent>
                {(close) => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <span>Bulk Send Message</span>
                        </ModalHeader>

                        <ModalBody>
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800">
                                        You are about to send a message to{" "}
                                        <span className="font-semibold">
                                            {selectedLeads.length}
                                        </span>{" "}
                                        lead{selectedLeads.length !== 1 ? "s" : ""}.
                                    </p>
                                </div>

                                <Select
                                    label="Message Type"
                                    placeholder="Choose Message Method"
                                    selectedKeys={actionType ? new Set([actionType]) : new Set()}
                                    onChange={(e) => setActionType(e.target.value)}
                                    isDisabled={isProcessing}
                                >
                                    <SelectItem key="sms">Text Message (SMS)</SelectItem>
                                    <SelectItem key="whatsapp">WhatsApp Message</SelectItem>
                                    <SelectItem key="email">Email</SelectItem>
                                </Select>

                                <Textarea
                                    placeholder="Enter your message..."
                                    minRows={3}
                                    value={message}
                                    onValueChange={setMessage}
                                    isDisabled={isProcessing}
                                />

                                {selectedLeads.length > 0 && (
                                    <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">
                                            Selected Leads:
                                        </p>
                                        <ul className="space-y-1">
                                            {selectedLeads.slice(0, 10).map((lead) => (
                                                <li key={lead.id} className="text-sm text-gray-700">
                                                    • {lead.name} ({lead.email})
                                                </li>
                                            ))}
                                            {selectedLeads.length > 10 && (
                                                <li className="text-sm text-gray-500 italic">
                                                    ... and {selectedLeads.length - 10} more
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {isProcessing && (
                                    <Progress
                                        aria-label="progress"
                                        value={(currentIndex / selectedLeads.length) * 100}
                                        className="w-full"
                                    />
                                )}
                            </div>
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={() => !isProcessing && close()}
                                isDisabled={isProcessing}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleComplete}
                                isDisabled={!canSend || isProcessing}
                            >
                                Send Message
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
