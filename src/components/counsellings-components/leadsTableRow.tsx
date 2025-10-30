import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Star, Download, FileText, Trash2, ArrowRight } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Lead } from "@/lib/mocktypes";
import { ColumnConfig } from "../leads-components/columnVisibilitySelector";
import { maskPhone } from "@/lib/maskingUtils";

interface LeadsTableRowProps {
    lead: Lead;
    visibleColumns: ColumnConfig[];
}

export default function LeadsTableRow({ lead, visibleColumns }: LeadsTableRowProps) {
    // Create a map to check if column is visible
    const isColumnVisible = (uid: string) => visibleColumns.some((col) => col.uid === uid);

    const renderCell = (uid: string) => {
        if (!isColumnVisible(uid)) return null;

        switch (uid) {
            case "select":
                return (
                    <TableCell key={uid}>
                        <Checkbox />
                    </TableCell>
                );
            case "serial":
                return (
                    <TableCell key={uid}>
                        <div className="font-medium">{lead.serial}</div>
                        <div className="text-xs text-gray-500">
                            {lead.date} {lead.time}
                        </div>
                    </TableCell>
                );
            case "name":
                return (
                    <TableCell key={uid}>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-gray-500">{maskPhone(lead.phone)}</div>
                    </TableCell>
                );
            case "branch":
                return <TableCell key={uid}>{lead.branch}</TableCell>;
            case "manager":
                return <TableCell key={uid}>{lead.leadManager}</TableCell>;
            case "source":
                return (
                    <TableCell key={uid}>
                        <Badge variant="destructive">{lead.leadSource}</Badge>
                    </TableCell>
                );
            case "country":
                return (
                    <TableCell key={uid}>
                        <div className="flex items-center gap-2">
                            <span>{lead.country}</span>
                        </div>
                    </TableCell>
                );
            case "status":
                return (
                    <TableCell key={uid}>
                        <Badge>{lead.status}</Badge>
                    </TableCell>
                );
            case "actions":
                return (
                    <TableCell key={uid} className="text-right">
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
                );
            default:
                return null;
        }
    };

    return <TableRow>{visibleColumns.map((col) => renderCell(col.uid))}</TableRow>;
}
