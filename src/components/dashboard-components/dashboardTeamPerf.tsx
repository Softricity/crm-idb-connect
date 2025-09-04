import React from 'react'
import { ChartBarMixed } from '../barchart'
import FilterBar from './dashboardFilter'

export default function DashboardTeamPerformance() {
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
                <ChartBarMixed />
                <ChartBarMixed />
                <ChartBarMixed />
                <ChartBarMixed />
                <ChartBarMixed />
                <ChartBarMixed />
                <ChartBarMixed />
                <ChartBarMixed />
                <ChartBarMixed />
                <ChartBarMixed />

            </div>
        </>
    )
}