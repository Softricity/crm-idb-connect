"use client";

import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    DropdownSection,
    Button,
} from "@heroui/react";
import {
    EllipsisVertical,
    MessageSquareText,
    MessageCircleCode,
    AtSign,
    Repeat,
    Replace,
    NotebookPen,
    CalendarFold,
    Plus,
    UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Lead } from "@/stores/useLeadStore";

interface LeadActionsMenuProps {
    leadId: string;
    lead?: Lead;
    onAssignClick?: () => void;
    showAssign?: boolean;
    userRole?: "admin" | "counsellor" | "agent";
}

export default function LeadActionsMenu({ leadId, lead, onAssignClick, showAssign = false, userRole = "admin" }: LeadActionsMenuProps) {
    const router = useRouter();
    
    // Determine the base path based on user role
    const basePath = userRole === "counsellor" ? "/counsellor/leads" : "/leads";
    
    return (
        <Dropdown>
            <DropdownTrigger>
                <Button isIconOnly variant="light" size="sm" aria-label="Lead Actions">
                    <EllipsisVertical className="h-5 w-5 text-gray-600" />
                </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Lead Actions Menu">
                <DropdownSection title="Actions">
                    {showAssign && onAssignClick ? (
                        <DropdownItem 
                            key="assign_counsellor" 
                            startContent={<UserCheck className={`h-4 w-4 ${lead?.assigned_to ? 'text-green-500' : 'text-gray-500'}`} />}
                            onClick={onAssignClick}
                        >
                            {lead?.assigned_to ? 'Reassign Counsellor' : 'Assign Counsellor'}
                        </DropdownItem>
                    ) : null}

                    <DropdownItem key="add_lead" startContent={<Plus className="h-4 w-4 text-blue-500" />}>
                        Lead to Application
                    </DropdownItem>

                    <DropdownItem key="change_status" startContent={<Replace className="h-4 w-4 text-orange-500" />}>
                        Change Lead Status
                    </DropdownItem>

                    {/* ✅ Notes Click Navigate */}
                    <DropdownItem
                        key="notes"
                        startContent={<NotebookPen className="h-4 w-4 text-indigo-500" />}
                        onClick={() => router.push(`${basePath}/${leadId}?tab=notes`)}
                    >
                        Notes
                    </DropdownItem>

                    <DropdownItem key="follow_up"
                        startContent={<CalendarFold className="h-4 w-4 text-pink-500" />}
                        onClick={() => router.push(`${basePath}/${leadId}?tab=followups`)}>
                        Follow-up
                    </DropdownItem>
                </DropdownSection>
                <DropdownSection title="Communicate">
                    <DropdownItem
                        key="text"
                        startContent={<MessageSquareText className="h-4 w-4 text-blue-500" />}
                        onClick={() => router.push(`${basePath}/${leadId}?tab=chat`)}
                    >
                        Text Message
                    </DropdownItem>
                    <DropdownItem
                        key="whatsapp"
                        startContent={<MessageCircleCode className="h-4 w-4 text-green-500" />}
                        onClick={() => router.push(`${basePath}/${leadId}?tab=whatsapp`)}>
                        WhatsApp
                    </DropdownItem>
                    <DropdownItem
                        key="mail"
                        startContent={<AtSign className="h-4 w-4 text-purple-500" />}
                        onClick={() => router.push(`${basePath}/${leadId}?tab=emails`)}>
                        Email
                    </DropdownItem>
                </DropdownSection>
            </DropdownMenu>
        </Dropdown>
    );
}