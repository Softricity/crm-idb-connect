"use client";
import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Button, Chip, DatePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";

interface FollowupModalProps {
    isOpen: boolean;
    onOpenChange: (val: boolean) => void;
    mode: "create" | "edit";
    followupTitle: string;
    setFollowupTitle: (val: string) => void;
    dueDate: Date | null;
    setDueDate: (val: Date | null) => void;
    customDueDate: string;
    setCustomDueDate: (val: string) => void;
    onSubmit: () => void;
}

export default function FollowupModal({
    isOpen,
    onOpenChange,
    mode,
    followupTitle,
    setFollowupTitle,
    dueDate,
    setDueDate,
    customDueDate,
    setCustomDueDate,
    onSubmit
}: FollowupModalProps) {
    const setDueDatePreset = (preset: "today" | "tomorrow" | "day-after" | "next-week" | "next-month") => {
        const now = new Date();
        let newDate = new Date();
        switch (preset) {
            case "today": newDate.setHours(18,0,0,0); break;
            case "tomorrow": newDate.setDate(now.getDate()+1); newDate.setHours(18,0,0,0); break;
            case "day-after": newDate.setDate(now.getDate()+2); newDate.setHours(18,0,0,0); break;
            case "next-week": newDate.setDate(now.getDate()+7); break;
            case "next-month": newDate.setMonth(now.getMonth()+1); break;
        }
        setDueDate(newDate);
        setCustomDueDate(newDate.toISOString().slice(0,10));
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
            <ModalContent>
                <ModalHeader>{mode==="create" ? "Create Follow Up" : "Edit Follow Up"}</ModalHeader>
                <ModalBody>
                    <Textarea placeholder={mode==="create" ? "Add a follow up..." : "Update follow up..."} value={followupTitle} onChange={(e)=>setFollowupTitle(e.target.value)} minRows={4} />
                    <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Due By</p>
                        <div className="flex gap-2 flex-wrap">
                            <Chip className="hover:cursor-pointer" onClick={()=>setDueDatePreset("today")}>Today</Chip>
                            <Chip className="hover:cursor-pointer" onClick={()=>setDueDatePreset("tomorrow")}>Tomorrow</Chip>
                            <Chip className="hover:cursor-pointer" onClick={()=>setDueDatePreset("day-after")}>Day After Tomorrow</Chip>
                            <Chip className="hover:cursor-pointer" onClick={()=>setDueDatePreset("next-week")}>Next Week</Chip>
                            <Chip className="hover:cursor-pointer" onClick={()=>setDueDatePreset("next-month")}>Next Month</Chip>
                            <DatePicker
                                label="Select Due Date"
                                value={customDueDate ? parseDate(customDueDate) : null}
                                onChange={(val) => {
                                    if(!val){ setCustomDueDate(""); setDueDate(null); return; }
                                    const dateString = val.toString();
                                    setCustomDueDate(dateString);
                                    setDueDate(new Date(val.year, val.month-1, val.day));
                                }}
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={()=>onOpenChange(false)}>Cancel</Button>
                    <Button color="primary" onPress={onSubmit} isDisabled={!followupTitle.trim() || !dueDate}>{mode==="create" ? "Create" : "Save Changes"}</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
