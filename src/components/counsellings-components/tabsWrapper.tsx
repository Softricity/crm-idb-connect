import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/lib/mocktypes";
import LeadsTable from "../leads-components/leadsTable";
import CounsellingTableToolbar from "./tableToolbar";

type TabName = "All" | "New" | "Lead In Process" | "Assigned" | "Cold" | "Rejected" | "Counselling In Process" | "Converted";

const TAB_LABELS: TabName[] = [
  "All",
  "Assigned",
  "Counselling In Process",
  "Converted",
  "Cold",
  "Rejected"
];

type TabsWrapperProps = {
  leads: Lead[];
};

export default function counsellingTabsWrapper({ leads }: TabsWrapperProps) {
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
          <CounsellingTableToolbar />
          <LeadsTable leads={leads} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
