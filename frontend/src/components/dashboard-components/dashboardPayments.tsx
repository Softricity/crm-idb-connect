import React, { useEffect, useState } from 'react'
import { ChartBarMixed } from '../barchart'
import { ChartConfig } from '../ui/chart'
import { OfflinePaymentsAPI } from '@/lib/api'
import { Spinner } from '@heroui/react'
import { useAuthStore } from '@/stores/useAuthStore'
import { format, subMonths } from 'date-fns'

export default function DashboardPayments() {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState<any[]>([]);
    const { user } = useAuthStore();

    useEffect(() => {
        const loadPayments = async () => {
            try {
                const data = await OfflinePaymentsAPI.fetchAllPayments();
                setPayments(data || []);
            } catch (err) {
                console.error("Failed to load payments", err);
            } finally {
                setLoading(false);
            }
        };
        loadPayments();
    }, []);

    const role = (user?.role || '').toLowerCase();
    const isSuper = role.includes('super');

    const totalReceived = payments
        .filter(p => !p.status || p.status === "RECEIVED")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalPending = payments
        .filter(p => p.status === "SCHEDULED" || p.status === "PENDING")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // 1. Status distribution (for Superadmin)
    const statusCounts = payments.reduce((acc: any, p) => {
        const status = p.status || "RECEIVED";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const barDataStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        fill: status === "RECEIVED" ? "#10B981" : status === "SCHEDULED" ? "#3B82F6" : "#F59E0B"
    }));

    // 2. Monthly Trend (for Counsellors)
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(new Date(), i);
        return format(d, "MMM yy");
    }).reverse();

    const trendCounts = payments.reduce((acc: any, p) => {
        if (!p.created_at) return acc;
        const month = format(new Date(p.created_at), "MMM yy");
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    const barDataTrend = last6Months.map(month => ({
        month,
        count: trendCounts[month] || 0,
        fill: "#10B981"
    }));

    const chartConfig: ChartConfig = {
        count: { label: "Count" }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner label="Loading payments..." />
            </div>
        );
    }

    return (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="bg-white rounded-3xl shadow-sm border p-8 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-all border-t-4 border-t-orange-500">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Total Pending Amount
                </h3>
                <p className="text-4xl font-extrabold text-orange-600">
                    {totalPending.toLocaleString()} <span className="text-lg font-medium opacity-70">INR</span>
                </p>
                <div className="mt-2 text-xs text-gray-400 font-medium">Accumulated across all applications</div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border p-8 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-all border-t-4 border-t-emerald-500">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Total Received Amount
                </h3>
                <p className="text-4xl font-extrabold text-emerald-600">
                    {totalReceived.toLocaleString()} <span className="text-lg font-medium opacity-70">INR</span>
                </p>
                <div className="mt-2 text-xs text-gray-400 font-medium">Successfully processed payments</div>
            </div>

            <div className="md:col-span-2 h-[480px]">
                <ChartBarMixed
                    title={isSuper ? "Payment Status Distribution" : "Monthly Payments Trend"}
                    chartData={isSuper ? barDataStatus : barDataTrend}
                    categoryKey={isSuper ? "status" : "month"}
                    dataKey="count"
                    chartConfig={chartConfig}
                    className="rounded-3xl border shadow-sm h-full"
                />
            </div>
        </div>
        </>
    )
}

