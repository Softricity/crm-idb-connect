"use client"
import React, { useEffect, useMemo } from 'react'
import { useDashboardStore } from '@/stores/useDashboardStore'
import DashboardTile from './dashboardTiles'
import StatusChart from './statusChart'
import SourceChart from './sourceChart'
import DashboardTimeline from './timeline'
import { LeadsLast7Days } from './last7DaysLeads'
import { useLeadStore } from '@/stores/useLeadStore'

import { useAuthStore } from '@/stores/useAuthStore'

export default function DashboardLeads() {
  const { loading, metrics, bySource, byStatus, last7Days, refresh } = useDashboardStore();
  const fetchLeadsBasedOnPermission = useLeadStore((s) => s.fetchLeadsBasedOnPermission);
  const leads = useLeadStore((s) => s.leads);
  const { user } = useAuthStore();
  const leadIds = useMemo(
    () => leads.map((lead) => lead.id!).filter(Boolean),
    [leads]
  );

  useEffect(() => {
    refresh();
    if (user?.id && user?.permissions) {
      fetchLeadsBasedOnPermission(user.id, user.permissions, undefined, user.role);
    }
  }, [refresh, fetchLeadsBasedOnPermission, user]);


  return (
    <div className="mt-6 space-y-6">
      {/* Tiles Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardTile label="Today's Leads" value={metrics.todaysLeads} loading={loading} />
        <DashboardTile label="Converted Leads" value={metrics.converted} loading={loading} />
        <DashboardTile label="Rejected Leads" value={metrics.rejected} loading={loading} />
        <DashboardTile label="Total Leads" value={metrics.total} loading={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <StatusChart data={byStatus} />
        <SourceChart data={bySource} />
        <DashboardTimeline leadIds={leadIds} />
        <LeadsLast7Days data={last7Days} />
      </div>


    </div>
  )
}

