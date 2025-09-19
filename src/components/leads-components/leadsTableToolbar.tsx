import {
  ChevronsUpDown,
  Download,
  Filter,
  Flag,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lead } from "@/stores/useLeadStore";

// UPDATED: Props now accept all leads and the IDs of selected leads
interface LeadsTableToolbarProps {
  allLeads: Lead[];
  selectedLeadIds: string[];
}

export default function LeadsTableToolbar({ allLeads, selectedLeadIds }: LeadsTableToolbarProps) {

  const handleDownloadCSV = () => {
    // UPDATED: Filter leads to get only the selected ones
    const leadsToExport = allLeads.filter(lead => selectedLeadIds.includes(lead.id!));

    if (leadsToExport.length === 0) {
      alert("Please select at least one lead to export.");
      return;
    }

    const headers: (keyof Lead)[] = [
      "id", "name", "mobile", "email", "alternate_mobile", "type", "city",
      "purpose", "preferred_country", "status", "utm_source", "utm_medium",
      "utm_campaign", "assigned_to", "created_at",
    ];

    // The rest of the logic now uses the filtered 'leadsToExport' array
    const csvContent = [
      headers.join(","),
      ...leadsToExport.map(lead =>
        headers.map(header => {
          const value = lead[header] ?? "";
          const stringValue = String(value);
          return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `selected_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3 ">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled>
          <Flag className="h-4 w-4 mr-2" /> Flagged
        </Button>
        <Button variant="secondary" size="sm" disabled>
          <Filter className="h-4 w-4 mr-2" /> Apply Filters
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
          <Download className="h-4 w-4 mr-2" />
          {selectedLeadIds.length > 0 ? `Download (${selectedLeadIds.length}) Selected` : 'Download CSV'}
        </Button>
      </div>
    </div>
  );
}