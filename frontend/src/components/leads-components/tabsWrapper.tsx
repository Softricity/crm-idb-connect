//tabsWrapper.tsx
import { useState, useMemo, useEffect } from "react";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import LeadsTableToolbar from "./leadsTableToolbar";
import LeadsDisplay from "./displayLeads";
import { Lead } from "@/stores/useLeadStore";
import { ColumnConfig } from "./columnVisibilitySelector";
import { BulkAssignCounsellorModal } from "./bulkAssignCounsellorModal";
import { filterLeads as applyFilters } from "@/lib/filterLeads";
import { LeadFilterState } from "@/types/filters";
import LeadFiltersDrawer from "./LeadFilters";
import { DepartmentsAPI } from "@/lib/api";


type StatusTab = {
  key: string;
  label: string;
};

interface DepartmentOrderConfig {
  order_index: number;
  is_default?: boolean;
}

interface DepartmentStatusConfig {
  key: string;
  label: string;
  order_index: number;
  is_default?: boolean;
  is_terminal?: boolean;
  is_active?: boolean;
}

interface DepartmentRecord {
  id: string;
  department_orders?: DepartmentOrderConfig[];
  department_statuses?: DepartmentStatusConfig[];
}

const FALLBACK_STATUS_TABS: StatusTab[] = [
  { key: "new", label: "New" },
  { key: "inprocess", label: "In Process" },
  { key: "assigned", label: "Assigned" },
  { key: "cold", label: "Cold" },
  { key: "rejected", label: "Rejected" },
];

const normalizeStatusToken = (value?: string | null) =>
  (value || "").toString().trim().toLowerCase();

const getDepartmentOrderIndex = (department: DepartmentRecord) =>
  department.department_orders?.[0]?.order_index ?? Number.MAX_SAFE_INTEGER;

const getDefaultDepartmentId = (departments: DepartmentRecord[]) => {
  const defaultDepartment = departments.find(
    (department) => department.department_orders?.[0]?.is_default,
  );

  if (defaultDepartment) {
    return defaultDepartment.id;
  }

  const sorted = [...departments].sort(
    (left, right) => getDepartmentOrderIndex(left) - getDepartmentOrderIndex(right),
  );

  return sorted[0]?.id;
};

// Default column configuration - only essential columns visible by default
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { uid: "select", name: "", isVisible: true, isMandatory: true },
  { uid: "date", name: "Date", isVisible: true, isMandatory: true },
  { uid: "name", name: "Name", isVisible: true, isMandatory: true },
  { uid: "phone", name: "Phone", isVisible: false, isMandatory: false },
  { uid: "email", name: "Email", isVisible: false, isMandatory: false },
  { uid: "owner", name: "Lead Owner", isVisible: true, isMandatory: false },
  { uid: "type", name: "Lead Type", isVisible: false, isMandatory: false },
  { uid: "source", name: "Lead Source", isVisible: false, isMandatory: false },
  { uid: "country", name: "Preferred Country", isVisible: false, isMandatory: false },
  { uid: "status", name: "Lead Stage", isVisible: true, isMandatory: false },
  { uid: "actions", name: "Action", isVisible: true, isMandatory: true },
];

type TabsWrapperProps = {
  leads: Lead[];
  pagination: { total: number; page: number; limit: number; totalPages: number; counts: Record<string, number> };
  onPageChange: (page: number) => void;
};

import { Pagination } from "@heroui/react";

export default function TabsWrapper({ leads, pagination, onPageChange }: TabsWrapperProps) {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [filters, setFilters] = useState<LeadFilterState>({
    search: "",
    courses: [],
    owners: [],
    statuses: [],
    sources: [],
    countries: [],
  });

  useEffect(() => {
    let isMounted = true;

    const fetchDepartments = async () => {
      try {
        const response = await DepartmentsAPI.fetchDepartments(false);
        if (!isMounted) {
          return;
        }

        const normalizedDepartments: DepartmentRecord[] = Array.isArray(response)
          ? response.map((department: any) => ({
              id: department.id,
              department_orders: department.department_orders || [],
              department_statuses: (department.department_statuses || [])
                .filter((status: any) => status.is_active !== false)
                .sort(
                  (left: any, right: any) =>
                    (left.order_index ?? 0) - (right.order_index ?? 0),
                ),
            }))
          : [];

        setDepartments(normalizedDepartments);
      } catch (error) {
        console.error("Failed to fetch department statuses for lead tabs:", error);
      }
    };

    fetchDepartments();

    return () => {
      isMounted = false;
    };
  }, []);
  
  // Calculate active filter count
  const filtersActiveCount = useMemo(() => {
    return filters.courses.length + filters.owners.length + filters.statuses.length + 
           filters.sources.length + filters.countries.length;
  }, [filters]);

  const activeDepartmentId = useMemo(() => {
    if (!departments.length) {
      return undefined;
    }

    const departmentLeadCounts = new Map<string, number>();
    for (const lead of leads) {
      if (!lead.current_department_id) {
        continue;
      }

      departmentLeadCounts.set(
        lead.current_department_id,
        (departmentLeadCounts.get(lead.current_department_id) || 0) + 1,
      );
    }

    let selectedDepartmentId: string | undefined;
    let maxCount = -1;
    for (const [departmentId, count] of departmentLeadCounts.entries()) {
      if (count > maxCount) {
        selectedDepartmentId = departmentId;
        maxCount = count;
      }
    }

    return selectedDepartmentId || getDefaultDepartmentId(departments);
  }, [departments, leads]);

  const activeDepartmentStatuses = useMemo(() => {
    if (!departments.length) {
      return [] as DepartmentStatusConfig[];
    }

    const targetDepartment =
      departments.find((department) => department.id === activeDepartmentId) ||
      departments.find((department) => department.id === getDefaultDepartmentId(departments));

    const statuses = (targetDepartment?.department_statuses || []).filter(
      (status) => status.is_active !== false,
    );

    return [...statuses].sort(
      (left, right) => (left.order_index ?? 0) - (right.order_index ?? 0),
    );
  }, [activeDepartmentId, departments]);

  const statusTabs = useMemo(() => {
    const tabs: StatusTab[] = [{ key: "all", label: "All" }];
    const seenTokens = new Set<string>();

    const sourceStatuses = activeDepartmentStatuses.length
      ? activeDepartmentStatuses.map((status) => ({
          key: normalizeStatusToken(status.key || status.label),
          label: status.label?.trim() || status.key,
        }))
      : FALLBACK_STATUS_TABS;

    for (const status of sourceStatuses) {
      const token = normalizeStatusToken(status.key);
      if (!token || seenTokens.has(token)) {
        continue;
      }

      tabs.push({
        key: token,
        label: status.label || token,
      });
      seenTokens.add(token);
    }

    return tabs;
  }, [activeDepartmentStatuses]);

  // Build filter options from current dataset
  const filterOptions = useMemo(() => {
    const uniq = <T extends string | null | undefined>(arr: T[]) =>
      Array.from(new Set(arr.filter(Boolean))) as string[];

    return {
      courses: uniq(leads.map((l) => l.preferred_course ?? "")),
      owners: uniq(leads.map((l) => l.partners_leads_assigned_toTopartners?.name ?? "Unassigned")),
      statuses: activeDepartmentStatuses.length
        ? activeDepartmentStatuses
            .map((status) => normalizeStatusToken(status.key || status.label))
            .filter(Boolean)
        : uniq(leads.map((l) => normalizeStatusToken(l.status))).filter(Boolean),
      sources: uniq(leads.map((l) => l.utm_source ?? "")),
      countries: uniq(leads.map((l) => l.preferred_country ?? "")),
    };
  }, [activeDepartmentStatuses, leads]);
  
  const filterLeads = (tabKey: string) => {
    let filteredLeads = leads;
    
    // First filter by tab
    if (tabKey !== "all") {
      filteredLeads = leads.filter(
        (lead) => normalizeStatusToken(lead.status) === tabKey,
      );
    }
    
    // Then apply advanced filters
    filteredLeads = applyFilters(filteredLeads, filters);
    
    // Then apply flagged filter if active
    if (showOnlyFlagged) {
      filteredLeads = filteredLeads.filter((lead) => lead.is_flagged === true);
    }
    
    return filteredLeads;
  };

  const renderTabTitle = (tab: StatusTab) => {
    const isAll = tab.key === "all";
    const totalCount = isAll ? pagination.total : (pagination.counts[tab.key] || 0);

    return (
      <div className="flex items-center justify-center">
        {tab.label}
        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 group-data-[selected=true]:bg-white group-data-[selected=true]:text-teal-600">
          {totalCount}
        </span>
      </div>
    );
  };

  const handleColumnsChange = (updatedColumns: ColumnConfig[]) => {
    setColumns(updatedColumns);
  };

  const handleBulkAssignComplete = () => {
    setSelectedLeadIds([]);
  };

  return (
    <div className="w-full p-3 overflow-x-auto">
      <Tabs aria-label="Lead Status Tabs" radius="md">
        {statusTabs.map((tab) => (
          <Tab key={tab.key} title={renderTabTitle(tab)}>
            <Card className="overflow-x-auto">
              <CardBody>
                <div className="gap-5 flex flex-col">
                  <LeadsTableToolbar 
                    allLeads={leads} 
                    selectedLeadIds={selectedLeadIds}
                    setSelectedLeadIds={setSelectedLeadIds}
                    columns={columns}
                    onColumnsChange={handleColumnsChange}
                    showOnlyFlagged={showOnlyFlagged}
                    onToggleFlagged={() => setShowOnlyFlagged(!showOnlyFlagged)}
                    currentTabLeads={filterLeads(tab.key)}
                    onBulkAssign={() => setIsBulkAssignModalOpen(true)}
                    onOpenFilters={() => setIsFiltersDrawerOpen(true)}
                    filtersActiveCount={filtersActiveCount}
                  />
                  <LeadsDisplay
                    leads={filterLeads(tab.key)}
                    selectedLeadIds={selectedLeadIds}
                    setSelectedLeadIds={setSelectedLeadIds}
                    columns={columns}
                    departmentStatuses={activeDepartmentStatuses}
                  />
                  
                  {pagination.totalPages > 1 && (
                    <div className="flex w-full justify-center mt-4">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={pagination.page}
                        total={pagination.totalPages}
                        onChange={onPageChange}
                      />
                    </div>
                  )}

                </div>
              </CardBody>
            </Card>
          </Tab>
        ))}
      </Tabs>

      <BulkAssignCounsellorModal
        isOpen={isBulkAssignModalOpen}
        onOpenChange={setIsBulkAssignModalOpen}
        selectedLeadIds={selectedLeadIds}
        allLeads={leads}
        onComplete={handleBulkAssignComplete}
      />

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