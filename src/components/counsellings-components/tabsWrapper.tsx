import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/lib/mocktypes";
import CounsellingTableToolbar from "./tableToolbar";
import LeadsTable from "./leadsTableCounselling";
import { ColumnConfig } from "../leads-components/columnVisibilitySelector";

type TabName = "All" | "New" | "Lead In Process" | "Assigned" | "Cold" | "Rejected" | "Counselling In Process" | "Converted";

const TAB_LABELS: TabName[] = [
  "All",
  "Assigned",
  "Counselling In Process",
  "Converted",
  "Cold",
  "Rejected"
];

// Default column configuration for counsellings
const DEFAULT_COUNSELLING_COLUMNS: ColumnConfig[] = [
  { uid: "select", name: "", isVisible: true, isMandatory: true },
  { uid: "serial", name: "Serial/Date", isVisible: true, isMandatory: true },
  { uid: "name", name: "Name/Phone", isVisible: true, isMandatory: true },
  { uid: "branch", name: "Branch", isVisible: false, isMandatory: false },
  { uid: "manager", name: "Lead Manager", isVisible: true, isMandatory: false },
  { uid: "source", name: "Lead Source", isVisible: false, isMandatory: false },
  { uid: "country", name: "Preferred Country", isVisible: false, isMandatory: false },
  { uid: "status", name: "Status", isVisible: true, isMandatory: false },
  { uid: "actions", name: "Action", isVisible: true, isMandatory: true },
];

type TabsWrapperProps = {
  leads: Lead[];
};

export default function counsellingTabsWrapper({ leads }: TabsWrapperProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COUNSELLING_COLUMNS);

  const handleColumnsChange = (updatedColumns: ColumnConfig[]) => {
    setColumns(updatedColumns);
  };

  return (
    <Tabs defaultValue="All" className="w-full">
      {/* Tab Buttons */}
      <TabsList className="rounded-md w-full py-5 px-0 mx-auto flex gap-2 bg-muted/40 shadow overflow-x-auto overflow-y-hidden">
        {TAB_LABELS.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="data-[state=active]:bg-teal-600 text-md data-[state=active]:text-white rounded-md px-4 py-5 transition-colors"
          >
            {tab}
            <Badge variant="outline" className="ml-2 bg-white">
              {/* Static count placeholder */}
              {leads.length}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Tab Content */}
      {TAB_LABELS.map((tab) => (
        <TabsContent key={tab} value={tab} className="gap-5 flex flex-col">
          <CounsellingTableToolbar columns={columns} onColumnsChange={handleColumnsChange} />
          <LeadsTable leads={leads} columns={columns} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
