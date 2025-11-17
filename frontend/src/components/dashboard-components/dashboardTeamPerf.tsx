import React from 'react'
import { ChartBarMixed } from '../barchart'
import FilterBar from './dashboardFilter'
import { ChartConfig } from '../ui/chart'

export default function DashboardTeamPerformance() {
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6  ">
                <ChartBarMixed
                    title="Study Leads by Lead Manager"
                    chartData={testBarData}
                    categoryKey="status"
                    dataKey="count"
                    chartConfig={testBarConfig}
                />
                <ChartBarMixed
                    title="Study Leads by Lead Manager"
                    chartData={testBarData}
                    categoryKey="status"
                    dataKey="count"
                    chartConfig={testBarConfig}
                />
                <ChartBarMixed
                    title="Study Leads by Lead Manager"
                    chartData={testBarData}
                    categoryKey="status"
                    dataKey="count"
                    chartConfig={testBarConfig}
                />
                <ChartBarMixed
                    title="Study Leads by Lead Manager"
                    chartData={testBarData}
                    categoryKey="status"
                    dataKey="count"
                    chartConfig={testBarConfig}
                />
                <ChartBarMixed
                    title="Study Leads by Lead Manager"
                    chartData={testBarData}
                    categoryKey="status"
                    dataKey="count"
                    chartConfig={testBarConfig}
                />
                <ChartBarMixed
                    title="Study Leads by Lead Manager"
                    chartData={testBarData}
                    categoryKey="status"
                    dataKey="count"
                    chartConfig={testBarConfig}
                />
                <ChartBarMixed
                    title="Study Leads by Lead Manager"
                    chartData={testBarData}
                    categoryKey="status"
                    dataKey="count"
                    chartConfig={testBarConfig}
                />
                <ChartBarMixed
                    title="Study Leads by Lead Manager"
                    chartData={testBarData}
                    categoryKey="status"
                    dataKey="count"
                    chartConfig={testBarConfig}
                />
                <ChartBarMixed
                    title="Study Leads by Lead Manager"
                    chartData={testBarData}
                    categoryKey="status"
                    dataKey="count"
                    chartConfig={testBarConfig}
                />
                <ChartBarMixed
                    title="Study Leads by Lead Manager"
                    chartData={testBarData}
                    categoryKey="status"
                    dataKey="count"
                    chartConfig={testBarConfig}
                />
            </div>
        </>
    )
}