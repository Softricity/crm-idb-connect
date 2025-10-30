import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Lead } from "@/lib/mocktypes";
import LeadsTableRow from "./leadsTableRow";
import { ColumnConfig } from "../leads-components/columnVisibilitySelector";

interface LeadsTableProps {
    leads: Lead[];
    columns: ColumnConfig[];
}

export default function LeadsTable({ leads, columns }: LeadsTableProps) {
    // Filter visible columns
    const visibleColumns = columns.filter((col) => col.isVisible);

    // Map column uid to header name
    const getColumnHeader = (uid: string): string => {
        const headerMap: Record<string, string> = {
            select: "",
            serial: "Serial/Date",
            name: "Name/Phone",
            branch: "Branch",
            manager: "Lead Manager",
            source: "Lead Source",
            country: "Preferred Country",
            status: "Status",
            actions: "Action",
        };
        return headerMap[uid] || "";
    };

    return (
        <div className="w-full">
            <div className="max-h-[67vh] overflow-y-auto">
                <Table className="relative">
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                            {visibleColumns.map((col) => (
                                <TableHead
                                    key={col.uid}
                                    className={
                                        col.uid === "select"
                                            ? "w-[50px]"
                                            : col.uid === "actions"
                                            ? "text-center"
                                            : col.uid === "status"
                                            ? "text-start"
                                            : ""
                                    }
                                >
                                    {col.uid === "select" ? <Checkbox /> : getColumnHeader(col.uid)}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map((lead) => (
                            <LeadsTableRow key={lead.id} lead={lead} visibleColumns={visibleColumns} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
