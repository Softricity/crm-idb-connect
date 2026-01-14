"use client";

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
import { useState } from "react";
import { toast } from "sonner";
import { CommissionsAPI } from "@/lib/api";

interface CommissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string;
    agentId: string;
    leadName: string;
    onSuccess?: () => void;
}

export default function CommissionModal({
    isOpen,
    onClose,
    leadId,
    leadName,
    agentId,
    onSuccess,
}: CommissionModalProps) {
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [status, setStatus] = useState("PENDING");
    const [remarks, setRemarks] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const currencyOptions = [
        { value: "USD", label: "USD" },
        { value: "EUR", label: "EUR" },
        { value: "GBP", label: "GBP" },
        { value: "INR", label: "INR" },
        { value: "AUD", label: "AUD" },
        { value: "CAD", label: "CAD" },
    ];

    const statusOptions = [
        { value: "PENDING", label: "Pending" },
        { value: "APPROVED", label: "Approved" },
        { value: "PAID", label: "Paid" },
        { value: "REJECTED", label: "Rejected" },
    ];

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setIsLoading(true);
        try {
            await CommissionsAPI.create({
                lead_id: leadId,
                application_id: null,
                amount: parseFloat(amount),
                currency,
                status,
                agent_id: agentId,
                remarks: remarks || undefined,
            });

            toast.success("Commission created successfully");
            handleClose();
            onSuccess?.();
        } catch (error: any) {
            console.error("Error creating commission:", error);
            toast.error(error.message || "Failed to create commission");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setAmount("");
        setCurrency("USD");
        setStatus("PENDING");
        setRemarks("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    Create Commission
                    <p className="text-sm font-normal text-gray-500">
                        For: {leadName}
                    </p>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Amount"
                                placeholder="0.00"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                isRequired
                                step="0.01"
                                min="0"
                            />
                            <Select
                                label="Currency"
                                placeholder="Select currency"
                                selectedKeys={[currency]}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as string;
                                    setCurrency(value);
                                }}
                                isRequired
                            >
                                {currencyOptions.map((option) => (
                                    <SelectItem key={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>

                        <Select
                            label="Status"
                            placeholder="Select status"
                            selectedKeys={[status]}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string;
                                setStatus(value);
                            }}
                            isRequired
                        >
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </Select>

                        <Textarea
                            label="Remarks"
                            placeholder="Enter any additional notes..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            minRows={3}
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleSubmit}
                        isLoading={isLoading}
                        isDisabled={isLoading}
                    >
                        Create Commission
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
