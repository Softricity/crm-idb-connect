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
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox />
                        </TableHead>
                        <TableHead>Serial/Date</TableHead>
                        <TableHead>Name/Phone</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Lead Manager</TableHead>
                        <TableHead>Lead Source</TableHead>
                        <TableHead>Preferred Country</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                </TableHeader>
            </Table>

            <div className="max-h-[61vh] overflow-y-auto">
                <Table>
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
