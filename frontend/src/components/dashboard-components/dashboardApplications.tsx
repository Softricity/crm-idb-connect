import React, { useEffect, useState } from 'react'
import { ChartBarMixed } from '../barchart'
import { ChartPieDonut } from '../piechart'
import { ChartConfig } from '../ui/chart'
import { DashboardAPI } from '@/lib/api'
import { Spinner } from '@heroui/react'
import { useAuthStore } from '@/stores/useAuthStore'

export default function DashboardApplications() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await DashboardAPI.getApplicationStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load application stats", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const role = (user?.role || '').toLowerCase();
  const isSuper = role.includes('super');

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Loading application stats..." />
      </div>
    );
  }

  // 1. Status distribution
  const barDataStatus = Object.entries(stats.byStatus || {}).map(([status, count]) => ({
    status,
    count,
    fill: status === "converted" ? "#10B981" : status === "rejected" ? "#EF4444" : "#3B82F6"
  }));

  // 2. Country distribution
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];
  
  const pieDataCountry = Object.entries(stats.byCountry || {}).map(([country, leads], index) => ({
    country,
    leads,
    fill: COLORS[index % COLORS.length]
  }));

  // 3. Source distribution
  const pieDataSource = Object.entries(stats.bySource || {}).map(([source, leads], index) => ({
    source,
    leads,
    fill: COLORS[(index + 3) % COLORS.length] // Offset to differentiate from country chart
  }));

  // 4. Monthly Trend
  const barDataTrend = (stats.monthlyTrend || []).map((item: any) => ({
    ...item,
    fill: "#3B82F6"
  }));

  const chartConfig: ChartConfig = {
    count: { label: "Count" },
    leads: { label: "Leads" }
  };

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
            title={isSuper ? "Applications Overview" : "Monthly Applications Trend"}
            chartData={barDataTrend}
            categoryKey="month"
            dataKey="count"
            chartConfig={chartConfig}
            className="rounded-3xl border shadow-sm h-full"
          />
        </div>
      </div>
    </>
  )
}
