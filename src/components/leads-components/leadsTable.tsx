import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table";
import LeadsTableRow from "./leadsTableRow";
import { Lead } from "@/stores/useLeadStore";

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
                        {leads.map((lead: any) => (
                            <LeadsTableRow key={lead.id} lead={lead} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
