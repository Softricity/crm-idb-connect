import { Card, CardHeader, CardBody, Spinner } from "@heroui/react";
import { ReactNode } from "react";

type DashboardTileProps = {
    label: string;
    value: number | string;
    icon?: ReactNode;
    loading?: boolean;
};

export default function DashboardTile({ label, value, icon, loading }: DashboardTileProps) {
    const getThemeColor = () => {
        if (label.includes("Converted")) return "border-emerald-500";
        if (label.includes("Rejected")) return "border-rose-500";
        if (label.includes("Today")) return "border-amber-500";
        return "border-indigo-500";
    };

    return (
        <Card shadow="sm" radius="none" className={`h-full border-t-4 ${getThemeColor()} bg-white group hover:shadow-md transition-all duration-300 rounded-3xl`}>
            <CardHeader className="flex items-center justify-between pb-1 pt-5 px-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-opacity-100 transition-colors">
                    {icon || <div className="w-4 h-4 rounded-full bg-gray-200" />}
                </div>
            </CardHeader>
            <CardBody className="pt-2 pb-6 px-6">
                {loading ? (
                    <div className="flex items-center justify-center h-12">
                        <Spinner size="sm" />
                    </div>
                ) : (
                    <div className="flex items-baseline gap-2">
                         <div className="text-4xl font-extrabold text-gray-900 tracking-tight">{value}</div>
                         <div className="text-[10px] font-medium text-gray-400">total leads</div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};
