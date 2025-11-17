import React from 'react'
import { ChartBarMixed } from '../barchart'
import FilterBar from './dashboardFilter'
import { ChartConfig } from '../ui/chart'

export default function DashboardPayments() {
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6  ">
                <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center justify-center">
                    <h3 className="text-lg font-semibold text-center mb-2">
                        Total Pending Amount
                    </h3>
                    <hr className="border-dotted border-t border-gray-300 w-full mb-6" />
                    <p className="text-4xl font-bold text-blue-600 text-center">
                        5000 INR
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center justify-center">
                    <h3 className="text-lg font-semibold text-center mb-2">
                        Total Received Amount
                    </h3>
                    <hr className="border-dotted border-t border-gray-300 w-full mb-6" />
                    <p className="text-4xl font-bold text-emerald-400 text-center">
                        20000 INR
                    </p>
                </div>
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

