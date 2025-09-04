import React from 'react'
import { ChartBarMixed } from '../barchart'
import { ChartPieDonut } from '../piechart'
import FilterBar from './dashboardFilter'

export default function DashboardApplications() {
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
      <div className="flex flex-col md:flex-row justify-between gap-10 mt-6">
        <ChartBarMixed />
        <ChartPieDonut />
      </div>
      <div className="flex flex-col md:flex-row justify-center gap-10 mt-6">
        <ChartPieDonut />
        <ChartBarMixed />
      </div>
      <div className='mt-6'>
        <ChartBarMixed />
      </div>
    </>
  )
}

