'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Download, ArrowRight, FlagIcon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Lead } from "@/stores/useLeadStore";
import LeadActionsMenu from "./tableActionCell";

interface LeadsTableRowProps {
    lead: Lead;
    isSelected: boolean;
    onSelect: (id: string, checked: boolean) => void;
}

export default function LeadsTableRow({ lead, isSelected, onSelect }: LeadsTableRowProps) {
    const router = useRouter();

    const handleRedirect = () => {
        router.push(`/leads/${lead.id}`);
    };

    return (
        <TableRow>
            <TableCell>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(lead.id!, !!checked)}
                    aria-label={`Select lead ${lead.name}`}
                />
            </TableCell>
            <TableCell>
                <div className="text-xs text-gray-500">
                    {lead.created_at ? format(new Date(lead.created_at), "dd MMM yyyy, HH:mm") : "-"}
                </div>
            </TableCell>
            <TableCell>
                <div className="font-medium">{lead.name}</div>
                <div className="text-xs text-gray-500">{lead.mobile}</div>
            </TableCell>
            <TableCell>
                {lead.assigned_to ?? "Unassigned"}
            </TableCell>
            <TableCell>
                <Badge variant="outline" className="capitalize">
                    {lead?.type ?? "-"}
                </Badge>
            </TableCell>
            <TableCell>
                <span className="capitalize">{lead.utm_source ?? "-"} / {lead.utm_medium ?? "-"} / {lead.utm_campaign ?? "-"}</span>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <span>{lead.preferred_country ?? "-"}</span>
                </div>
            </TableCell>
            <TableCell>
                <Badge className="capitalize" variant={"outline"}>{lead.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <FlagIcon className="h-4 w-4 text-gray-500" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <span>Flag</span>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <LeadActionsMenu />
                            </TooltipTrigger>
                            <TooltipContent>
                                <span>Actions</span>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleRedirect}>
                                    <ArrowRight className="h-4 w-4 text-gray-500" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <span>Go to Lead</span>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </TableCell>
        </TableRow>
    );
}