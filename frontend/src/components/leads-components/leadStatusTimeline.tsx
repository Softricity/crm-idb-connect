import { useEffect, useMemo, useState } from "react";
import {
    Select,
    SelectItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Textarea,
} from "@heroui/react";
import { DepartmentsAPI, DropdownsAPI } from "@/lib/api";

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

const REJECTED_REASONS_CATEGORY = "rejected_reasons";
const CONVERTED_REASONS_CATEGORY = "converted_reasons";

const FALLBACK_REJECTED_REASON_OPTIONS = [
    "Number Invalid",
    "Lead Not Responsive",
    "Not Eligible for Program",
    "Budget Constraints",
    "No Required Documents",
    "Timeline Not Suitable",
    "Language Requirement Not Met",
    "Chose Competitor/Alternative",
    "Lost Contact",
    "Not Interested",
    "Duplicate/Invalid Lead",
    "Profile Not Qualified",
    "Other",
];

const FALLBACK_CONVERTED_REASON_OPTIONS = [
    "Application Submitted",
    "Payment Completed",
    "Documents Verified",
    "Eligibility Confirmed",
    "Counselling Completed",
    "Offer Letter Received",
    "Interview Cleared",
    "Test Score Approved",
    "Admission Confirmed",
    "Ready for Next Stage",
    "Others",
];

const isOtherReasonToken = (value?: string | null) => {
    const token = normalizeStatusToken(value);
    return token === "other" || token === "others";
};

const toUniqueLabels = (values: string[]) => {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of values) {
        const normalized = normalizeStatusToken(value);
        if (!normalized || seen.has(normalized)) {
            continue;
        }

        seen.add(normalized);
        result.push(value.trim());
    }

    return result;
};

const ensureOtherOption = (values: string[]) => {
    if (values.some((value) => isOtherReasonToken(value))) {
        return values;
    }

    return [...values, "Others"];
};

interface DropdownOption {
    id: string;
    label: string;
    value: string;
    is_active: boolean;
}

interface DropdownCategory {
    id: string;
    name: string;
    label?: string;
    is_system: boolean;
    options: DropdownOption[];
}

export default function StatusTimeline({
    currentStatus: initialCurrentStatus,
    currentDepartmentId,
    onChange,
}: {
    currentStatus: string;
    currentDepartmentId?: string | null;
    onChange: (status: string, reason?: string) => void;
}) {
    const [currentStatus, setCurrentStatus] = useState(initialCurrentStatus);
    const [departmentStatuses, setDepartmentStatuses] = useState<DepartmentStatusConfig[]>([]);
    const [reasonOptionsByStatus, setReasonOptionsByStatus] = useState<Record<string, string[]>>({
        rejected: FALLBACK_REJECTED_REASON_OPTIONS,
        converted: FALLBACK_CONVERTED_REASON_OPTIONS,
    });

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
            } catch (error) {
                console.error("Failed to fetch department statuses for lead timeline:", error);
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

    useEffect(() => {
        let isMounted = true;

        const fetchReasonOptions = async () => {
            try {
                const categories = (await DropdownsAPI.getAllCategories()) as DropdownCategory[];
                if (!isMounted) {
                    return;
                }

                const getCategoryOptions = (categoryName: string) => {
                    const category = categories.find(
                        (item) => normalizeStatusToken(item.name) === normalizeStatusToken(categoryName),
                    );

                    const activeOptions = (category?.options || [])
                        .filter((option) => option.is_active !== false)
                        .map((option) => option.label?.trim())
                        .filter((label): label is string => Boolean(label));

                    const uniqueOptions = toUniqueLabels(activeOptions);
                    if (!uniqueOptions.length) {
                        return [];
                    }

                    return ensureOtherOption(uniqueOptions);
                };

                const rejectedReasons = getCategoryOptions(REJECTED_REASONS_CATEGORY);
                const convertedReasons = getCategoryOptions(CONVERTED_REASONS_CATEGORY);

                setReasonOptionsByStatus({
                    rejected: rejectedReasons.length
                        ? rejectedReasons
                        : FALLBACK_REJECTED_REASON_OPTIONS,
                    converted: convertedReasons.length
                        ? convertedReasons
                        : FALLBACK_CONVERTED_REASON_OPTIONS,
                });
            } catch (error) {
                console.error("Failed to fetch reason dropdown options:", error);
                if (isMounted) {
                    setReasonOptionsByStatus({
                        rejected: FALLBACK_REJECTED_REASON_OPTIONS,
                        converted: FALLBACK_CONVERTED_REASON_OPTIONS,
                    });
                }
            }
        };

        fetchReasonOptions();

        return () => {
            isMounted = false;
        };
    }, []);

    const statusOptions = useMemo(() => {
        if (departmentStatuses.length) {
            return departmentStatuses;
        }

        return FALLBACK_STATUSES;
    }, [departmentStatuses]);

    const currentIndex = statusOptions.findIndex((status) => {
        const statusToken = normalizeStatusToken(status.key || status.label);
        return statusToken === normalizeStatusToken(currentStatus);
    });

    const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState("");
    const [reason, setReason] = useState("");
    const [otherReasonText, setOtherReasonText] = useState("");

    const pendingStatusToken = normalizeStatusToken(pendingStatus);

    const activeReasonOptions = useMemo(() => {
        if (pendingStatusToken === "converted") {
            return reasonOptionsByStatus.converted || FALLBACK_CONVERTED_REASON_OPTIONS;
        }

        if (pendingStatusToken === "rejected") {
            return reasonOptionsByStatus.rejected || FALLBACK_REJECTED_REASON_OPTIONS;
        }

        return reasonOptionsByStatus.rejected || FALLBACK_REJECTED_REASON_OPTIONS;
    }, [pendingStatusToken, reasonOptionsByStatus]);

    const handleStatusChange = (newStatus: string) => {
        if (!newStatus) return;

        const selectedStatus = statusOptions.find((status) =>
            normalizeStatusToken(status.key || status.label) === normalizeStatusToken(newStatus)
        );
        const requiresReason =
            selectedStatus?.is_terminal === true ||
            newStatus === "cold" ||
            newStatus === "rejected";

        if (requiresReason) {
            setPendingStatus(newStatus);
            setReason("");
            setOtherReasonText("");
            setIsReasonDialogOpen(true);
        } else {
            setCurrentStatus(newStatus);
            onChange(newStatus);
        }
    };

    const handleConfirmReason = () => {
        const finalReason = isOtherReasonToken(reason) ? otherReasonText.trim() : reason;
        if (finalReason && pendingStatus) {
            setCurrentStatus(pendingStatus);
            onChange(pendingStatus, finalReason);
            setIsReasonDialogOpen(false); // Close the modal on confirm
        }
    };

    const handleDialogClose = () => {
        setPendingStatus("");
        setReason("");
        setOtherReasonText("");
        setIsReasonDialogOpen(false);
    };

    const isConfirmDisabled = !reason || (isOtherReasonToken(reason) && !otherReasonText.trim());

    return (
        <>
            <div className="flex items-center justify-between w-full p-6 bg-white rounded-lg shadow">
                {/* The timeline visualization logic remains unchanged */}
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

            <Modal isOpen={isReasonDialogOpen} onOpenChange={handleDialogClose}>
                <ModalContent>
                    <ModalHeader className="capitalize">Select Reason for '{pendingStatus}' Status</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-gray-500 mb-4">
                            Please provide a reason for this status change.
                        </p>
                        <div className="space-y-4">
                            <Select
                                label="Reason"
                                placeholder="Select a reason..."
                                selectedKeys={reason ? [reason] : []}
                                onSelectionChange={(keys) => setReason(Array.from(keys)[0] as string)}
                            >
                                {activeReasonOptions.map((opt) => (
                                    <SelectItem key={opt}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </Select>

                            {isOtherReasonToken(reason) && (
                                <Textarea
                                    label="Please specify"
                                    placeholder="Enter the specific reason"
                                    value={otherReasonText}
                                    onValueChange={setOtherReasonText}
                                />
                            )}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={handleDialogClose}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleConfirmReason} disabled={isConfirmDisabled} className="text-white">
                          Confirm
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};