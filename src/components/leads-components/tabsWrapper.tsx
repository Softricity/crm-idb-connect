//tabsWrapper.tsx
import { useState } from "react";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import LeadsTableToolbar from "./leadsTableToolbar";
import LeadsDisplay from "./displayLeads";
import { Lead } from "@/stores/useLeadStore";


type TabName = "All" | "New" | "Lead In Process" | "Assigned" | "Cold" | "Rejected";

const TAB_LABELS: TabName[] = [
  "All",
  "New",
  "Lead In Process",
  "Assigned",
  "Cold",
  "Rejected",
];

type TabsWrapperProps = {
  leads: Lead[];
};

export default function TabsWrapper({ leads }: TabsWrapperProps) {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const filterLeads = (tab: TabName) => {
    if (tab === "All") return leads;
    return leads.filter((lead) => {
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
  };

  const renderTabTitle = (tab: TabName) => (
    <div className="flex items-center justify-center">
      {tab}
      <span className="ml-2 inline-flex items-center justify-center rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 group-data-[selected=true]:bg-white group-data-[selected=true]:text-teal-600">
        {filterLeads(tab).length}
      </span>
    </div>
  );

  return (
    <div className="w-full">
      <Tabs aria-label="Lead Status Tabs" radius="md">
        {TAB_LABELS.map((tab) => (
          <Tab key={tab} title={renderTabTitle(tab)}>
            <Card>
              <CardBody>
                <div className="gap-5 flex flex-col">
                  <LeadsTableToolbar allLeads={leads} selectedLeadIds={selectedLeadIds} />
                  <LeadsDisplay
                    leads={filterLeads(tab)}
                    selectedLeadIds={selectedLeadIds}
                    setSelectedLeadIds={setSelectedLeadIds}
                  />

                </div>
              </CardBody>
            </Card>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}