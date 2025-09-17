import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Lead } from "@/lib/mocktypes";
import LeadsTableRow from "./leadsTableRow";

interface LeadsTableProps {
    leads: Lead[];
}

export default function LeadsTable({ leads }: LeadsTableProps) {
    return (
        <div className="w-full">
            <div className="max-h-[67vh] overflow-y-auto">
                <Table className="relative">
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow >
                        <TableHead className="w-[50px]">
                            <Checkbox />
                        </TableHead>
                        <TableHead>Serial/Date</TableHead>
                        <TableHead>Name/Phone</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Lead Manager</TableHead>
                        <TableHead>Lead Source</TableHead>
                        <TableHead>Preferred Country</TableHead>
                        <TableHead className="text-start">Status</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                </TableHeader>
                    <TableBody>
                        {leads.map((lead) => (
                            <LeadsTableRow key={lead.id} lead={lead} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
