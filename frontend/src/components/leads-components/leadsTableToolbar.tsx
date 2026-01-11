import {
  ChevronsUpDown,
  Download,
  Filter,
  Flag,
  MoreHorizontal,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lead } from "@/stores/useLeadStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { hasAnyPermission, hasPermission, LeadPermission } from "@/lib/utils";
import ColumnVisibilitySelector, { ColumnConfig } from "./columnVisibilitySelector";
import { useState } from "react";
import BulkChangeStatusModal from "./bulkChangeStatusModal";
import { set } from "date-fns";
import BulkCommunicationModal from "./bulkCommunicationModal";

interface LeadsTableToolbarProps {
  allLeads: Lead[];
  selectedLeadIds: string[];
  setSelectedLeadIds: (ids: string[]) => void;
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  showOnlyFlagged: boolean;
  onToggleFlagged: () => void;
  currentTabLeads: Lead[];
  onBulkAssign?: () => void;
  onOpenFilters?: () => void;
  filtersActiveCount?: number;
}

export default function LeadsTableToolbar({
  allLeads,
  selectedLeadIds,
  setSelectedLeadIds,
  columns,
  onColumnsChange,
  showOnlyFlagged,
  onToggleFlagged,
  currentTabLeads,
  onBulkAssign,
  onOpenFilters,
  filtersActiveCount = 0
}: LeadsTableToolbarProps) {

  const { user } = useAuthStore();
  const userPermissions = user?.permissions || [];
  const canManageLeads = hasAnyPermission(userPermissions, [LeadPermission.LEAD_MANAGE, LeadPermission.LEAD_ASSIGNMENT]);
  const canDownloadLeads = hasAnyPermission(userPermissions, [LeadPermission.LEAD_DOWNLOAD]);
  
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [isBulkCommunicationModalOpen, setIsBulkCommunicationModalOpen] = useState(false);

  // Count flagged leads in current view
  const flaggedCount = currentTabLeads.filter(lead => lead.is_flagged === true).length;

  const handleDownloadCSV = () => {
    const leadsToExport =
      selectedLeadIds.length > 0
        ? allLeads.filter((lead) => selectedLeadIds.includes(lead?.id ?? ""))
        : allLeads;

    if (leadsToExport.length === 0) {
      alert("Please select at least one lead to export.");
      return;
    }

    const headers: (keyof Lead)[] = [
      "id", "name", "mobile", "email", "type", "preferred_course",
      "preferred_country", "status", "utm_source", "utm_medium",
      "utm_campaign", "assigned_to", "created_at", "reason", "is_flagged",
    ];

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
    <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3 overflow-x-auto">
      {canManageLeads && (<div className="flex items-center gap-2">
        <Button
          variant={showOnlyFlagged ? "default" : "secondary"}
          size="sm"
          onClick={onToggleFlagged}
          className={showOnlyFlagged ? "bg-primary text-white hover:bg-primary/90" : "text-white"}
        >
          <Flag className={`h-4 w-4 mr-2 ${showOnlyFlagged ? 'fill-white' : 'fill-red-500 text-red-500'}`} />
          {showOnlyFlagged ? 'Show All' : `Flagged (${flaggedCount})`}
        </Button>
        {selectedLeadIds.length > 0 && onBulkAssign && hasPermission(user?.permissions ?? [], LeadPermission.LEAD_ASSIGNMENT) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onBulkAssign}
            className="text-white"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Assign ({selectedLeadIds.length})
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          className="text-white"
          disabled={selectedLeadIds.length === 0}
          onClick={() => setIsBulkStatusOpen(true)}
        >
          Change Status ({selectedLeadIds.length})
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="text-white"
          disabled={selectedLeadIds.length === 0}
          onClick={() => setIsBulkCommunicationModalOpen(true)}
        >
          Bulk Send Message ({selectedLeadIds.length})
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenFilters}
          className="text-white"
        >
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters {filtersActiveCount > 0 && `(${filtersActiveCount})`}
        </Button>
      </div>)}
      <div className="flex items-center gap-2">
        <ColumnVisibilitySelector
          columns={columns}
          onColumnsChange={onColumnsChange}
          storageKey="leads_column_visibility"
        />
        {canDownloadLeads && (
          <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            {selectedLeadIds.length > 0 ? `Download (${selectedLeadIds.length}) Selected` : 'Download CSV'}
          </Button>
        )}
      </div>

      <BulkChangeStatusModal
        isOpen={isBulkStatusOpen}
        onOpenChange={setIsBulkStatusOpen}
        selectedLeadIds={selectedLeadIds}
        allLeads={allLeads}
        onComplete={() => (setSelectedLeadIds([]))}
      />
      <BulkCommunicationModal
        isOpen={isBulkCommunicationModalOpen}
        onOpenChange={setIsBulkCommunicationModalOpen}
        selectedLeadIds={selectedLeadIds}
        allLeads={allLeads}
        onComplete={() => (setSelectedLeadIds([]))}
        // // pass your actual messaging functions here
        // sendSMS={sendSMS}
        // sendWhatsAppMessage={sendWhatsAppMessage}
        // sendEmail={sendEmail}
      />
    </div>
  );
}