import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Star, Download, FileText, Trash2, ArrowRight } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Lead } from "@/lib/mocktypes";

export default function LeadsTableRow({ lead }: { lead: Lead }) {
    return (
        <TableRow>
            <TableCell>
                <Checkbox /> 
            </TableCell>
            <TableCell>
                <div className="font-medium">{lead.serial}</div>
                <div className="text-xs text-gray-500">{lead.date} {lead.time}</div>
            </TableCell>
            <TableCell>
                <div className="font-medium">{lead.name}</div>
                <div className="text-xs text-gray-500">{lead.phone}</div>
            </TableCell>
            <TableCell>{lead.branch}</TableCell>
            <TableCell>{lead.leadManager}</TableCell>
            <TableCell><Badge variant="destructive">{lead.leadSource}</Badge></TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <span>{lead.country}</span>
                </div>
            </TableCell>
            <TableCell><Badge>{lead.status}</Badge></TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon">
                        <Star className="h-4 w-4 text-gray-400" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <FileText className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <ArrowRight className="h-4 w-4 text-gray-500" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
