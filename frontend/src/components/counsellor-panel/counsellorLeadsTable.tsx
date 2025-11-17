"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLeadStore, Lead } from "@/stores/useLeadStore";
import { format } from "date-fns";
import {
  Chip,
  Spinner,
  Card,
  CardBody,
  Tabs,
  Tab,
} from "@heroui/react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { maskPhone, maskEmail } from "@/lib/maskingUtils";
import { ColumnConfig } from "@/components/leads-components/columnVisibilitySelector";
import { filterLeads } from "@/lib/filterLeads";
import { LeadFilterState } from "@/types/filters";
import LeadFiltersDrawer from "@/components/leads-components/LeadFilters";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import ColumnVisibilitySelector from "@/components/leads-components/columnVisibilitySelector";
import LeadsTable from "@/components/leads-components/leadsTable";

const statusColorMap: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  new: "primary",
  interested: "secondary",
  inprocess: "warning",
  hot: "warning",
  engaged: "warning",
  contacted: "secondary",
  assigned: "success",
  cold: "default",
  rejected: "danger",
};

// Default column configuration
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { uid: "date", name: "Date", isVisible: true, isMandatory: true },
  { uid: "name", name: "Name", isVisible: true, isMandatory: true },
  { uid: "phone", name: "Phone", isVisible: false, isMandatory: false },
  { uid: "email", name: "Email", isVisible: false, isMandatory: false },
  { uid: "type", name: "Lead Type", isVisible: false, isMandatory: false },
  { uid: "source", name: "Lead Source", isVisible: false, isMandatory: false },
  { uid: "country", name: "Preferred Country", isVisible: false, isMandatory: false },
  { uid: "status", name: "Lead Stage", isVisible: true, isMandatory: false },
  { uid: "actions", name: "Action", isVisible: true, isMandatory: true },
];

export function CounsellorLeadsTable() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { leads, loading, getCounsellorLeads, updateLead } = useLeadStore();
  
  // Column visibility state
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  
  // Selected leads for bulk operations (not used but required by LeadsTable)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  
  // Filter state
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<LeadFilterState>({
    search: "",
    types: [],
    owners: [],
    statuses: [],
    sources: [],
    countries: [],
  });

  // Fetch counsellor leads when user is available
  React.useEffect(() => {
    if (user?.id) {
      getCounsellorLeads(user.id);
    }
  }, [user?.id]);

  // Refetch leads when coming back to the page
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        getCounsellorLeads(user.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  // Get visible columns for table
  const visibleColumns = React.useMemo(
    () => columns.filter((col) => col.isVisible),
    [columns]
  );

  // Filter leads
  const filteredLeads = React.useMemo(() => {
    let result = leads;

    // Apply flagged filter
    if (showOnlyFlagged) {
      result = result.filter((lead) => lead.is_flagged);
    }

    // Apply other filters
    result = filterLeads(result, filters);

    return result;
  }, [leads, showOnlyFlagged, filters]);

  // Group leads by status
  const leadsByStatus = React.useMemo(() => {
    return {
      all: filteredLeads,
      new: filteredLeads.filter((lead) => lead.status === "new"),
      interested: filteredLeads.filter((lead) => lead.status === "interested"),
      inprocess: filteredLeads.filter((lead) => lead.status === "inprocess"),
      hot: filteredLeads.filter((lead) => lead.status === "hot"),
      engaged: filteredLeads.filter((lead) => lead.status === "engaged"),
      contacted: filteredLeads.filter((lead) => lead.status === "contacted"),
      assigned: filteredLeads.filter((lead) => lead.status === "assigned"),
      cold: filteredLeads.filter((lead) => lead.status === "cold"),
      rejected: filteredLeads.filter((lead) => lead.status === "rejected"),
    };
  }, [filteredLeads]);

  // Generate filter options from leads data
  const filterOptions = React.useMemo(() => {
    const uniq = <T extends string | null | undefined>(arr: T[]) =>
      Array.from(new Set(arr.filter(Boolean))) as string[];

    return {
      types: uniq(leads.map((l) => l.purpose ?? "")),
      owners: [], // Owners filter only for admin
      statuses: uniq(leads.map((l) => (l.status ?? "").toLowerCase())).map(
        (s) => (s.charAt(0).toUpperCase() + s.slice(1)) || ""
      ),
      sources: uniq(leads.map((l) => l.utm_source ?? "")),
      countries: uniq(leads.map((l) => l.preferred_country ?? "")),
    };
  }, [leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardBody>
          {/* Toolbar */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFiltersDrawerOpen(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
                {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v) && (
                  <Chip size="sm" color="danger" variant="flat" className="ml-2">
                    {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v).length}
                  </Chip>
                )}
              </Button>

              <Button
                size="sm"
                variant={showOnlyFlagged ? "default" : "outline"}
                onClick={() => setShowOnlyFlagged(!showOnlyFlagged)}
              >
                <Flag className="h-4 w-4 mr-2" />
                Flagged Only
                {showOnlyFlagged && (
                  <Chip size="sm" color="warning" variant="flat" className="ml-2">
                    {filteredLeads.filter(l => l.is_flagged).length}
                  </Chip>
                )}
              </Button>

              <ColumnVisibilitySelector
                columns={columns}
                onColumnsChange={setColumns}
                storageKey="counsellor_leads_column_visibility"
              />
            </div>
          </div>

          {/* Tabs for status filtering */}
          <Tabs
            aria-label="Lead status tabs"
            color="primary"
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
            }}
          >
            <Tab
              key="all"
              title={
                <div className="flex items-center space-x-2">
                  <span>All</span>
                  <Chip size="sm" variant="flat">
                    {leadsByStatus.all.length}
                  </Chip>
                </div>
              }
            >
              <LeadsTable
                leads={leadsByStatus.all}
                selectedLeadIds={selectedLeadIds}
                setSelectedLeadIds={setSelectedLeadIds}
                columns={visibleColumns}
              />
            </Tab>

            <Tab
              key="new"
              title={
                <div className="flex items-center space-x-2">
                  <span>New</span>
                  <Chip size="sm" variant="flat">
                    {leadsByStatus.new.length}
                  </Chip>
                </div>
              }
            >
              <LeadsTable
                leads={leadsByStatus.new}
                selectedLeadIds={selectedLeadIds}
                setSelectedLeadIds={setSelectedLeadIds}
                columns={visibleColumns}
              />
            </Tab>

            <Tab
              key="interested"
              title={
                <div className="flex items-center space-x-2">
                  <span>Interested</span>
                  <Chip size="sm" variant="flat">
                    {leadsByStatus.interested.length}
                  </Chip>
                </div>
              }
            >
              <LeadsTable
                leads={leadsByStatus.interested}
                selectedLeadIds={selectedLeadIds}
                setSelectedLeadIds={setSelectedLeadIds}
                columns={visibleColumns}
              />
            </Tab>

            <Tab
              key="inprocess"
              title={
                <div className="flex items-center space-x-2">
                  <span>In Process</span>
                  <Chip size="sm" variant="flat">
                    {leadsByStatus.inprocess.length}
                  </Chip>
                </div>
              }
            >
              <LeadsTable
                leads={leadsByStatus.inprocess}
                selectedLeadIds={selectedLeadIds}
                setSelectedLeadIds={setSelectedLeadIds}
                columns={visibleColumns}
              />
            </Tab>

            <Tab
              key="hot"
              title={
                <div className="flex items-center space-x-2">
                  <span>Hot</span>
                  <Chip size="sm" variant="flat">
                    {leadsByStatus.hot.length}
                  </Chip>
                </div>
              }
            >
              <LeadsTable
                leads={leadsByStatus.hot}
                selectedLeadIds={selectedLeadIds}
                setSelectedLeadIds={setSelectedLeadIds}
                columns={visibleColumns}
              />
            </Tab>

            <Tab
              key="engaged"
              title={
                <div className="flex items-center space-x-2">
                  <span>Engaged</span>
                  <Chip size="sm" variant="flat">
                    {leadsByStatus.engaged.length}
                  </Chip>
                </div>
              }
            >
              <LeadsTable
                leads={leadsByStatus.engaged}
                selectedLeadIds={selectedLeadIds}
                setSelectedLeadIds={setSelectedLeadIds}
                columns={visibleColumns}
              />
            </Tab>

            <Tab
              key="contacted"
              title={
                <div className="flex items-center space-x-2">
                  <span>Contacted</span>
                  <Chip size="sm" variant="flat">
                    {leadsByStatus.contacted.length}
                  </Chip>
                </div>
              }
            >
              <LeadsTable
                leads={leadsByStatus.contacted}
                selectedLeadIds={selectedLeadIds}
                setSelectedLeadIds={setSelectedLeadIds}
                columns={visibleColumns}
              />
            </Tab>

            <Tab
              key="assigned"
              title={
                <div className="flex items-center space-x-2">
                  <span>Assigned</span>
                  <Chip size="sm" variant="flat">
                    {leadsByStatus.assigned.length}
                  </Chip>
                </div>
              }
            >
              <LeadsTable
                leads={leadsByStatus.assigned}
                selectedLeadIds={selectedLeadIds}
                setSelectedLeadIds={setSelectedLeadIds}
                columns={visibleColumns}
              />
            </Tab>

            <Tab
              key="cold"
              title={
                <div className="flex items-center space-x-2">
                  <span>Cold</span>
                  <Chip size="sm" variant="flat">
                    {leadsByStatus.cold.length}
                  </Chip>
                </div>
              }
            >
              <LeadsTable
                leads={leadsByStatus.cold}
                selectedLeadIds={selectedLeadIds}
                setSelectedLeadIds={setSelectedLeadIds}
                columns={visibleColumns}
              />
            </Tab>

            <Tab
              key="rejected"
              title={
                <div className="flex items-center space-x-2">
                  <span>Rejected</span>
                  <Chip size="sm" variant="flat">
                    {leadsByStatus.rejected.length}
                  </Chip>
                </div>
              }
            >
              <LeadsTable
                leads={leadsByStatus.rejected}
                selectedLeadIds={selectedLeadIds}
                setSelectedLeadIds={setSelectedLeadIds}
                columns={visibleColumns}
              />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Filters Drawer */}
      <LeadFiltersDrawer
        isOpen={isFiltersDrawerOpen}
        onOpenChange={setIsFiltersDrawerOpen}
        value={filters}
        onChange={setFilters}
        options={filterOptions}
      />
    </div>
  );
}
