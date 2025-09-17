import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  const filterLeads = (tab: TabName) => {
    if (tab === "All") return leads;
    return leads.filter((lead) => {
      const status = lead.status?.toLowerCase();
      switch (tab) {
        case "New":
          return status === "new";
        case "Lead In Process":
          return status === "interested" || status === "inprocess" || status === "contacted";
        case "Assigned":
          return !!lead.assignedto;
        case "Cold":
          return status === "cold";
        case "Rejected":
          return status === "rejected";
        default:
          return true;
      }
    });
  };

  return (
    <Tabs defaultValue="All" className="w-full">
      <TabsList className="rounded-md w-full py-5 px-0 mx-auto flex gap-2 bg-muted/40 shadow overflow-x-auto overflow-y-hidden">
        {TAB_LABELS.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="data-[state=active]:bg-teal-600 text-md data-[state=active]:text-white rounded-md px-4 py-5 transition-colors"
          >
            {tab}
            <Badge variant="outline" className="ml-2 bg-white">
              {filterLeads(tab).length}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      {TAB_LABELS.map((tab) => (
        <TabsContent key={tab} value={tab} className="gap-5 flex flex-col">
          <LeadsTableToolbar />
          <LeadsDisplay leads={filterLeads(tab)} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
