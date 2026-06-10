import { useEffect, useMemo, useState } from "react";
import { Select, SelectItem } from "@heroui/react";
import { DepartmentsAPI } from "@/lib/api";

interface DepartmentStatusConfig {
    key: string;
    label: string;
    order_index: number;
    is_terminal?: boolean;
    is_default?: boolean;
    is_active?: boolean;
}

const FALLBACK_STATUSES: DepartmentStatusConfig[] = [
    { key: "new", label: "New", order_index: 0, is_default: true },
    { key: "engaged", label: "Engaged", order_index: 1 },
    { key: "hot", label: "Hot", order_index: 2 },
    { key: "assigned", label: "Assigned", order_index: 3 },
    { key: "cold", label: "Cold", order_index: 4, is_terminal: true },
    { key: "rejected", label: "Rejected", order_index: 5, is_terminal: true },
];

const normalizeStatusToken = (value?: string | null) =>
    (value || "").toString().trim().toLowerCase();

export default function StatusTimeline({
    currentStatus: initialCurrentStatus,
    currentDepartmentId,
    onChange,
}: {
    currentStatus: string;
    currentDepartmentId?: string | null;
    onChange: (status: string) => void;
}) {
    const [currentStatus, setCurrentStatus] = useState(initialCurrentStatus);
    const [departmentStatuses, setDepartmentStatuses] = useState<DepartmentStatusConfig[]>([]);

    useEffect(() => {
        setCurrentStatus(initialCurrentStatus);
    }, [initialCurrentStatus]);

    useEffect(() => {
        let isMounted = true;

        const fetchDepartmentStatuses = async () => {
            if (!currentDepartmentId) {
                setDepartmentStatuses([]);
                return;
            }

            try {
                const response = await DepartmentsAPI.fetchDepartmentStatuses(currentDepartmentId);
                if (!isMounted) {
                    return;
                }

                const normalizedStatuses = Array.isArray(response)
                    ? response
                        .filter((status: any) => status.is_active !== false)
                        .map((status: any) => ({
                            key: status.key,
                            label: status.label,
                            order_index: status.order_index ?? 0,
                            is_terminal: status.is_terminal,
                            is_default: status.is_default,
                        }))
                        .sort(
                            (left, right) =>
                                (left.order_index ?? 0) - (right.order_index ?? 0),
                        )
                    : [];

                setDepartmentStatuses(normalizedStatuses);
            } catch (error: any) {
                const message =
                    error?.body?.message ||
                    error?.body?.error ||
                    error?.message ||
                    "Failed to load department statuses.";
                console.error("Failed to fetch department statuses for lead timeline:", message, error);
                if (isMounted) {
                    setDepartmentStatuses([]);
                }
            }
        };

        fetchDepartmentStatuses();

        return () => {
            isMounted = false;
        };
    }, [currentDepartmentId]);

    const statusOptions = useMemo(() => {
        if (departmentStatuses.length) {
            const currentToken = normalizeStatusToken(currentStatus);
            const exists = departmentStatuses.some(
                (status) =>
                    normalizeStatusToken(status.key || status.label) === currentToken,
            );
            if (currentToken && !exists) {
                return [
                    ...departmentStatuses,
                    {
                        key: currentToken,
                        label: `${currentStatus} (Legacy)`,
                        order_index: departmentStatuses.length,
                        is_terminal: false,
                        is_default: false,
                    },
                ];
            }

            return departmentStatuses;
        }

        return FALLBACK_STATUSES;
    }, [departmentStatuses, currentStatus]);

    const currentIndex = statusOptions.findIndex((status) => {
        const statusToken = normalizeStatusToken(status.key || status.label);
        return statusToken === normalizeStatusToken(currentStatus);
    });

    const handleStatusChange = (newStatus: string) => {
        if (!newStatus) return;
        setCurrentStatus(newStatus);
        onChange(newStatus);
    };

    return (
        <div className="flex items-center justify-between w-full p-6 bg-white rounded-lg shadow">
            {/* Timeline visualization */}
            <div className="flex items-center w-full relative">
                {statusOptions.map((status, index) => {
                    const statusToken = normalizeStatusToken(status.key || status.label);
                    const isActive = currentIndex >= index;
                    const isNextActive = currentIndex >= index + 1;
                    const nextStatus = statusOptions[index + 1];
                    let circleClasses = "bg-gray-200 text-gray-600";
                    let labelClasses = "text-gray-500";
                    let lineClasses = "border-gray-300";

                    if (isActive) {
                        circleClasses = status.is_terminal ? "bg-red-500 text-white" : "bg-green-500 text-white";
                        labelClasses = status.is_terminal ? "text-red-600" : "text-green-600";
                    }

                    if (isNextActive) {
                        lineClasses = nextStatus?.is_terminal ? "border-red-500" : "border-green-500";
                    }

                    return (
                        <div key={statusToken || `${status.label}-${index}`} className="flex-1 flex flex-col items-center relative">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-semibold z-10 ${circleClasses}`}>
                                {index + 1}
                            </div>
                            <p className={`mt-2 text-sm font-medium capitalize ${labelClasses}`}>
                                {status.label || status.key}
                            </p>
                            {index < statusOptions.length - 1 && (
                                <div className={`absolute top-5 left-1/2 w-full h-0.5 border-t-2 border-dotted ${lineClasses}`} />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="ml-8">
                <Select
                    label="Change Status"
                    placeholder="Select a status"
                    selectedKeys={new Set([normalizeStatusToken(currentStatus)])}
                    onSelectionChange={(keys) => handleStatusChange(Array.from(keys)[0] as string)}
                    className="w-[200px]"
                >
                    {statusOptions.map((status) => {
                        const statusToken = normalizeStatusToken(status.key || status.label);
                        return (
                        <SelectItem key={statusToken} className="capitalize">
                            {status.label || status.key}
                        </SelectItem>
                        );
                    })}
                </Select>
            </div>
        </div>
    );
};
