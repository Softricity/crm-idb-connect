'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Trash2, ArrowRight, FlagIcon, EllipsisVertical } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Lead } from "@/stores/useLeadStore";
import LeadActionsMenu from "./tableActionCell";

export default function LeadsTableRow({ lead }: { lead: Lead }) {
    const router = useRouter();

    const handleRedirect = () => {
        router.push(`/leads/${lead.id}`);
    };
    return (
        <TableRow>

            <TableCell>
                <div className="text-xs text-gray-500">
                    {lead.createdat ? format(new Date(lead.createdat), "dd MMM yyyy, HH:mm") : "-"}
                </div>
            </TableCell>

            <TableCell>
                <div className="font-medium">{lead.name}</div>
                <div className="text-xs text-gray-500">{lead.mobile}</div>
            </TableCell>


            <TableCell>{lead.assignedto ?? "Unassigned"}</TableCell>

            <TableCell>
                <Badge variant="destructive" className="capitalize">{lead.utmsource ?? "-"}</Badge>
            </TableCell>

            <TableCell>
                <div className="flex items-center gap-2">
                    <span>{lead.preferredcountry}</span>
                </div>
            </TableCell>

            <TableCell>
                <Badge className="capitalize" variant={"outline"}>{lead.status}</Badge>
            </TableCell>

            <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon">
                        <FlagIcon className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4 text-gray-500" />
                    </Button>
                    <LeadActionsMenu/>
                    <Button variant="ghost" size="icon" onClick={handleRedirect}>
                        <ArrowRight className="h-4 w-4 text-gray-500" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
