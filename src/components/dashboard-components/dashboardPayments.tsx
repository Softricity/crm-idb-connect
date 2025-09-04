import React from 'react'
import { ChartBarMixed } from '../barchart'
import FilterBar from './dashboardFilter'

export default function DashboardPayments() {
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
            </div>
            <div className="flex flex-col md:flex-row justify-center gap-10 mt-6">
                <ChartBarMixed />
                <ChartBarMixed />
            </div>
        </>
    )
}

