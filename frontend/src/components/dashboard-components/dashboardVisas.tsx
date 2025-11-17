import React from 'react'
import { ChartBarMixed } from '../barchart'
import { ChartPieDonut } from '../piechart'
import FilterBar from './dashboardFilter'
import { ChartConfig } from '../ui/chart'

export default function DashboardVisas() {
  const testPieChart = [
    { country: "Finland", leads: 77, fill: "#FDE68A" },
    { country: "Spain", leads: 14, fill: "#3B82F6" },
    { country: "Australia", leads: 7, fill: "#EC4899" },
    { country: "United Kingdom", leads: 6, fill: "#F59E0B" },
    { country: "United States", leads: 4, fill: "#34D399" },
  ]

  const testPieChartConfig: ChartConfig = {
    Finland: { label: "Finland", color: "#FDE68A" },
    Spain: { label: "Spain", color: "#3B82F6" },
    Australia: { label: "Australia", color: "#EC4899" },
    "United Kingdom": { label: "United Kingdom", color: "#F59E0B" },
    "United States": { label: "United States", color: "#34D399" },
  }

  const testBarData = [
    { status: "New", count: 30, fill: "#60A5FA" },
    { status: "Engaged", count: 0, fill: "#A1A1AA" },
    { status: "Hot", count: 0, fill: "#F59E0B" },
    { status: "Assigned", count: 0, fill: "#34D399" },
    { status: "Cold", count: 0, fill: "#CBD5E1" },
    { status: "Rejected", count: 2, fill: "#F87171" },
  ]

  const testBarConfig: ChartConfig = {
    New: {
      label: "New",
      color: "#60A5FA", // Blue
    },
    Engaged: {
      label: "Engaged",
      color: "#A1A1AA", // Gray
    },
    Hot: {
      label: "Hot",
      color: "#F59E0B", // Amber
    },
    Assigned: {
      label: "Assigned",
      color: "#34D399", // Green
    },
    Cold: {
      label: "Cold",
      color: "#CBD5E1", // Cool gray
    },
    Rejected: {
      label: "Rejected",
      color: "#F87171", // Red
    },
  }

  return (
    <>
      <FilterBar
        branches={["Delhi", "Mumbai", "Pune"]}
        users={["Alice", "Bob", "Charlie"]}
        // onApply={handleApply}
        // onClear={handleClear}
        selectedDateRange={"06/08/2025 - 04/09/2025"}
        daysCount={30}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6">
        <ChartBarMixed
          title="Study Leads Overview"
          chartData={testBarData}
          dataKey="count"
          categoryKey="status"
          chartConfig={testBarConfig}
        />
        <ChartPieDonut
          title="Study Leads by Countries"
          description="Aug 2025 – Sep 2025"
          chartData={testPieChart}
          dataKey="leads"
          nameKey="country"
          chartConfig={testPieChartConfig}
        />
        <ChartBarMixed
          title="Study Leads Overview"
          chartData={testBarData}
          dataKey="count"
          categoryKey="status"
          chartConfig={testBarConfig}
        />
        <ChartBarMixed
          title="Study Leads Overview"
          chartData={testBarData}
          dataKey="count"
          categoryKey="status"
          chartConfig={testBarConfig}
        />
      </div>
    </>
  )
}


