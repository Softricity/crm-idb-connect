//tabsWrapper.tsx
import { useState } from "react";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import LeadsTableToolbar from "./leadsTableToolbar";
import LeadsDisplay from "./displayLeads";
import { Lead } from "@/stores/useLeadStore";
import { ColumnConfig } from "./columnVisibilitySelector";
import { BulkAssignCounsellorModal } from "./bulkAssignCounsellorModal";


type TabName = "All" | "New" | "Lead In Process" | "Assigned" | "Cold" | "Rejected";

const TAB_LABELS: TabName[] = [
  "All",
  "New",
  "Lead In Process",
  "Assigned",
  "Cold",
  "Rejected",
];

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
};

export default function TabsWrapper({ leads }: TabsWrapperProps) {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  
  const filterLeads = (tab: TabName) => {
    let filteredLeads = leads;
    
    // First filter by tab
    if (tab !== "All") {
      filteredLeads = leads.filter((lead) => {
        const status = lead.status?.toLowerCase();
        switch (tab) {
          case "New":
            return status === "new";
          case "Lead In Process":
            return status === "interested" || status === "inprocess" || status === "contacted" || status === "hot" || status === "engaged";
          case "Assigned":
            return status === "assigned";
          case "Cold":
            return status === "cold";
          case "Rejected":
            return status === "rejected";
          default:
            return true;
        }
      });
    }
    
    // Then apply flagged filter if active
    if (showOnlyFlagged) {
      filteredLeads = filteredLeads.filter((lead) => lead.is_flagged === true);
    }
    
    return filteredLeads;
  };

  const renderTabTitle = (tab: TabName) => (
    <div className="flex items-center justify-center">
      {tab}
      <span className="ml-2 inline-flex items-center justify-center rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 group-data-[selected=true]:bg-white group-data-[selected=true]:text-teal-600">
        {filterLeads(tab).length}
      </span>
    </div>
  );

  const handleColumnsChange = (updatedColumns: ColumnConfig[]) => {
    setColumns(updatedColumns);
  };

  const handleBulkAssignComplete = () => {
    setSelectedLeadIds([]);
  };

  return (
    <div className="w-full">
      <Tabs aria-label="Lead Status Tabs" radius="md">
        {TAB_LABELS.map((tab) => (
          <Tab key={tab} title={renderTabTitle(tab)}>
            <Card>
              <CardBody>
                <div className="gap-5 flex flex-col">
                  <LeadsTableToolbar 
                    allLeads={leads} 
                    selectedLeadIds={selectedLeadIds}
                    columns={columns}
                    onColumnsChange={handleColumnsChange}
                    showOnlyFlagged={showOnlyFlagged}
                    onToggleFlagged={() => setShowOnlyFlagged(!showOnlyFlagged)}
                    currentTabLeads={filterLeads(tab)}
                    onBulkAssign={() => setIsBulkAssignModalOpen(true)}
                  />
                  <LeadsDisplay
                    leads={filterLeads(tab)}
                    selectedLeadIds={selectedLeadIds}
                    setSelectedLeadIds={setSelectedLeadIds}
                    columns={columns}
                  />

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
    </div>
  );
}