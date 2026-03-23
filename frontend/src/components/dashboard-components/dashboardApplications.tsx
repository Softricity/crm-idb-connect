import React, { useEffect, useState } from 'react'
import { ChartBarMixed } from '../barchart'
import { ChartPieDonut } from '../piechart'
import { ChartConfig } from '../ui/chart'
import { LeadsAPI } from '@/lib/api'
import { Spinner } from '@heroui/react'
import { useAuthStore } from '@/stores/useAuthStore'
import { format, subMonths, startOfMonth, isAfter } from 'date-fns'

export default function DashboardApplications() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    const loadApps = async () => {
      try {
        const data = await LeadsAPI.fetchApplications();
        setApplications(data || []);
      } catch (err) {
        console.error("Failed to load applications", err);
      } finally {
        setLoading(false);
      }
    };
    loadApps();
  }, []);

  const role = (user?.role || '').toLowerCase();
  const isSuper = role.includes('super');

  // 1. Status distribution
  const statusCounts = applications.reduce((acc: any, app) => {
    const status = app.status || "New";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const barDataStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    fill: status === "converted" ? "#10B981" : status === "rejected" ? "#EF4444" : "#3B82F6"
  }));

  // 2. Country distribution
  const countryCounts = applications.reduce((acc: any, app) => {
    const country = app.preferred_country || "Unknown";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});
  const pieDataCountry = Object.entries(countryCounts).map(([country, leads]) => ({
    country,
    leads,
    fill: `hsl(${Math.random() * 360}, 70%, 60%)`
  }));

  // 3. Source distribution
  const sourceCounts = applications.reduce((acc: any, app) => {
    const source = app.utm_source || "Direct";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  const pieDataSource = Object.entries(sourceCounts).map(([source, leads]) => ({
    source,
    leads,
    fill: `hsl(${Math.random() * 360}, 70%, 50%)`
  }));

  // 4. Manager distribution (For Superadmin)
  const managerCounts = applications.reduce((acc: any, app) => {
    const manager = app.partners_leads_assigned_toTopartners?.name || "Unassigned";
    acc[manager] = (acc[manager] || 0) + 1;
    return acc;
  }, {});
  const barDataManager = Object.entries(managerCounts).map(([manager, count]) => ({
    manager,
    count,
    fill: "#8B5CF6"
  }));

  // 5. Monthly Trend (For Counsellors)
  // Get last 6 months labels
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), i);
    return format(d, "MMM yy");
  }).reverse();

  const trendCounts = applications.reduce((acc: any, app) => {
    if (!app.created_at) return acc;
    const month = format(new Date(app.created_at), "MMM yy");
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const barDataTrend = last6Months.map(month => ({
    month,
    count: trendCounts[month] || 0,
    fill: "#3B82F6"
  }));

  const chartConfig: ChartConfig = {
    count: { label: "Count" },
    leads: { label: "Leads" }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Loading applications..." />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        <div className="md:col-span-1 h-[480px]">
          <ChartBarMixed
            title="Overview by Status"
            chartData={barDataStatus}
            dataKey="count"
            categoryKey="status"
            chartConfig={chartConfig}
            className="rounded-3xl border shadow-sm h-full"
          />
        </div>
        <div className="md:col-span-1 h-[480px]">
          <ChartPieDonut
            title="Preferred Countries"
            chartData={pieDataCountry}
            dataKey="leads"
            nameKey="country"
            chartConfig={chartConfig}
            className="rounded-3xl border shadow-sm h-full"
          />
        </div>
        <div className="md:col-span-1 h-[480px]">
          <ChartPieDonut
            title="Lead Source Distribution"
            chartData={pieDataSource}
            dataKey="leads"
            nameKey="source"
            chartConfig={chartConfig}
            className="rounded-3xl border shadow-sm h-full"
          />
        </div>
        <div className="md:col-span-1 h-[480px]">
          <ChartBarMixed
            title={isSuper ? "Applications by Manager" : "Monthly Applications Trend"}
            chartData={isSuper ? barDataManager : barDataTrend}
            categoryKey={isSuper ? "manager" : "month"}
            dataKey="count"
            chartConfig={chartConfig}
            className="rounded-3xl border shadow-sm h-full"
          />
        </div>
      </div>
    </>
  )
}

