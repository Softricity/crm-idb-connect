"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    EllipsisVertical,
    MessageSquare,
    MessageSquareText,
    MessageCircleCode,
    AtSign,
    Repeat,
    Replace,
    NotebookPen,
    CalendarFold,
    Plus,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export default function LeadActionsMenu() {
    return (
        <DropdownMenu>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <EllipsisVertical className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <span>Lead Actions</span>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DropdownMenuContent
                align="end"
                className="w-60 rounded-xl border bg-white dark:bg-gray-900 shadow-lg p-2"
            >
                <DropdownMenuLabel className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    Lead Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />

                {/* Add Lead */}
                <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg gap-2">
                    <Plus className="h-4 w-4 text-blue-500" />  Lead to Application
                </DropdownMenuItem>

                {/* Communicate with Submenu */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg gap-2">
                        <MessageSquare className="h-4 w-4 text-green-500" />
                        Communicate
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-white dark:bg-gray-900 border rounded-xl shadow-md">
                        <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800 gap-2">
                            <MessageSquareText className="h-4 w-4 text-blue-500" /> Text Message
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800 gap-2">
                            <MessageCircleCode className="h-4 w-4 text-green-500" /> WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800 gap-2">
                            <AtSign className="h-4 w-4 text-purple-500" /> Mailer
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg gap-2">
                    <Replace className="h-4 w-4 text-orange-500" /> Change Lead Status
                </DropdownMenuItem>

                <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg gap-2">
                    <NotebookPen className="h-4 w-4 text-indigo-500" /> Notes
                </DropdownMenuItem>

                <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg gap-2">
                    <CalendarFold className="h-4 w-4 text-pink-500" /> Follow-up
                </DropdownMenuItem>

                <DropdownMenuItem className="hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg gap-2">
                    <Repeat className="h-4 w-4 text-red-500" /> Reassign
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
