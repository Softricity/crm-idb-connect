"use client";
import { useEffect } from "react";
import { Spacer } from "@heroui/react";
import { useDashboardStore } from "@/stores/useDashboardStore";
import StatusChart from "../../../components/dashboard-components/statusChart";
import SourceChart from "@/components/dashboard-components/sourceChart";
import DashboardTile from "@/components/dashboard-components/dashboardTiles";
import { LeadsLast7Days } from "@/components/dashboard-components/last7DaysLeads";
import DashboardTimeline from "@/components/dashboard-components/timeline";

export default function Page() {
  const { loading, metrics, bySource, byStatus, last7Days, refresh } = useDashboardStore();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const tempIds = ["64989d48-8e59-4204-bf5e-84083ac784e4", "077602db-2d2b-463f-bea4-60b738d7dd9a"];
  return (
    <div className="p-6 space-y-6">
      {/* Tiles Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardTile label="Today's Leads" value={metrics.todaysLeads} loading={loading} />
        <DashboardTile label="Converted Leads" value={metrics.converted} loading={loading} />
        <DashboardTile label="Rejected Leads" value={metrics.rejected} loading={loading} />
        <DashboardTile label="Total Leads" value={metrics.total} loading={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusChart data={byStatus} />
          <SourceChart data={bySource} />
        </div>
        <DashboardTimeline leadIds={tempIds} />
        <LeadsLast7Days data={last7Days} />
      </div>


    </div>
  );
}
