"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EllipsisVertical, MessageSquare, Phone, Mail, Repeat } from "lucide-react";

export default function LeadActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical className="h-5 w-5 text-gray-600" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 rounded-lg shadow-md">
        <DropdownMenuLabel>Lead Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Add Lead */}
        <DropdownMenuItem>
          ➕ Add Lead to Application
        </DropdownMenuItem>

        {/* Communicate with Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <MessageSquare className="mr-2 h-4 w-4" />
            Communicate
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>📩 Text Message</DropdownMenuItem>
            <DropdownMenuItem>💬 WhatsApp</DropdownMenuItem>
            <DropdownMenuItem>📧 Mailer</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Change Status */}
        <DropdownMenuItem>
          🔄 Change Lead Status
        </DropdownMenuItem>

        {/* Notes */}
        <DropdownMenuItem>
          📝 Notes
        </DropdownMenuItem>

        {/* Follow-up */}
        <DropdownMenuItem>
          📅 Follow-up
        </DropdownMenuItem>

        {/* Reassign */}
        <DropdownMenuItem>
          <Repeat className="mr-2 h-4 w-4" />
          Reassign
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
