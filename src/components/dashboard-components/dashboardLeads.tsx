import React from 'react'
import { ChartBarMixed } from '../barchart'
import { ChartPieDonut } from '../piechart'
import FilterBar from './dashboardFilter'
import { ChartConfig } from '../ui/chart'

export default function DashboardLeads() {
  const leadsByCountry = [
    { country: "Finland", leads: 77, fill: "#FDE68A" },
    { country: "Spain", leads: 14, fill: "#3B82F6" },
    { country: "Australia", leads: 7, fill: "#EC4899" },
    { country: "United Kingdom", leads: 6, fill: "#F59E0B" },
    { country: "United States", leads: 4, fill: "#34D399" },
  ]

  const countryChartConfig: ChartConfig = {
    Finland: { label: "Finland", color: "#FDE68A" },
    Spain: { label: "Spain", color: "#3B82F6" },
    Australia: { label: "Australia", color: "#EC4899" },
    "United Kingdom": { label: "United Kingdom", color: "#F59E0B" },
    "United States": { label: "United States", color: "#34D399" },
  }

  const leadsOverviewData = [
    { status: "New", count: 30, fill: "#60A5FA" },
    { status: "Engaged", count: 0, fill: "#A1A1AA" },
    { status: "Hot", count: 0, fill: "#F59E0B" },
    { status: "Assigned", count: 0, fill: "#34D399" },
    { status: "Cold", count: 0, fill: "#CBD5E1" },
    { status: "Rejected", count: 2, fill: "#F87171" },
  ]

  const leadsOverviewConfig: ChartConfig = {
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

  const sourceData = [
    { source: "QR", count: 113, fill: "#60A5FA" },
    { source: "Walk In", count: 4, fill: "#F472B6" },
  ]

  const sourceChartConfig: ChartConfig = {
    QR: {
      label: "QR",
      color: "#60A5FA",
    },
    "Walk In": {
      label: "Walk In",
      color: "#F472B6",
    },
  }

  const leadManagerData = [
    { manager: "Tllak Parajuli", leads: 6, fill: "#FDBA74" },     // Orange
    { manager: "Manisha Raut", leads: 12, fill: "#6EE7B7" },       // Mint
    { manager: "Pramila Khatri", leads: 2, fill: "#60A5FA" },      // Blue
    { manager: "Rashmi Bhatta", leads: 48, fill: "#E879F9" },      // Pink
    { manager: "Govinda Raj Bisural", leads: 9, fill: "#6EE7B7" }, // Mint
    { manager: "Shiva Pradhan", leads: 15, fill: "#FCA5A5" },      // Red
    { manager: "Ishwor Ghimire", leads: 23, fill: "#E879F9" },     // Pink
  ]

  const leadManagerChartConfig: ChartConfig = {
    "Tllak Parajuli": { color: "#FDBA74" },       // orange-300
    "Manisha Raut": { color: "#6EE7B7" },         // green-300
    "Pramila Khatri": { color: "#60A5FA" },       // blue-400
    "Rashmi Bhatta": { color: "#E9D5FF" },        // purple-300
    "Govinda Raj Bisural": { color: "#6EE7B7" },  // green-300
    "Shiva Pradhan": { color: "#FCA5A5" },        // red-300
    "Ishwor Ghimire": { color: "#E9D5FF" },       // purple-300
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
      <div className="grid grid-cols-1 md:grid-cols-2 mt-6 gap-10  ">
        <ChartBarMixed
          title="Study Leads Overview"
          chartData={leadsOverviewData}
          dataKey="count"
          categoryKey="status"
          chartConfig={leadsOverviewConfig}
        />
        <ChartPieDonut
          title="Study Leads by Countries"
          description="Aug 2025 – Sep 2025"
          chartData={leadsByCountry}
          dataKey="leads"
          nameKey="country"
          chartConfig={countryChartConfig}
        />
        <ChartPieDonut
          title="Lead Source Distribution"
          description="QR vs Walk In"
          chartData={sourceData}
          nameKey="source"
          dataKey="count"
          chartConfig={sourceChartConfig}
        />
        <ChartBarMixed
          title="Study Leads by Lead Manager"
          chartData={leadManagerData}
          categoryKey="manager"
          dataKey="leads"
          chartConfig={leadManagerChartConfig}
        />
      </div>
    </>
  )
}

