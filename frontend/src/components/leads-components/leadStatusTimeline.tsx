import { useState } from "react";
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

const statuses = ["new", "engaged", "hot", "assigned", "cold", "rejected"];
const timelineStatuses = ["new", "engaged", "hot", "assigned"];

const reasonOptions = [
    "Number Invalid",
    "Lead Not Responsive",
    "Wants Low Tuition Fee Options",
    "Wants 100% Scholarship Options",
    "Funds Issue",
    "Already Got Visa from other Agent",
    "Not Enough IELTS",
    "Graduation Marks too less",
    "12th Marks too less",
    "Customer Rude",
    "Wants Work Permit",
    "Wants Tourist Visa",
    "Others",
];

export default function StatusTimeline({
    currentStatus: initialCurrentStatus,
    onChange,
}: {
    currentStatus: string;
    onChange: (status: string, reason?: string) => void;
}) {
    const [currentStatus, setCurrentStatus] = useState(initialCurrentStatus);
    const currentIndex = statuses.findIndex(
        (status) => status.toLowerCase() === currentStatus.toLowerCase()
    );
    const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState("");
    const [reason, setReason] = useState("");
    const [otherReasonText, setOtherReasonText] = useState("");

    const handleStatusChange = (newStatus: string) => {
        if (!newStatus) return;
        if (newStatus === "cold" || newStatus === "rejected") {
            setPendingStatus(newStatus);
            setIsReasonDialogOpen(true);
        } else {
            setCurrentStatus(newStatus);
            onChange(newStatus);
        }
    };

    const handleConfirmReason = () => {
        const finalReason = reason === "Others" ? otherReasonText : reason;
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

    const isConfirmDisabled = !reason || (reason === "Others" && !otherReasonText.trim());

    const displayStatuses = [...timelineStatuses];
    if (currentStatus === 'rejected') {
        displayStatuses[3] = 'rejected';
    } else if (currentStatus === 'cold') {
        displayStatuses[3] = 'cold';
    }

    return (
        <>
            <div className="flex items-center justify-between w-full p-6 bg-white rounded-lg shadow">
                {/* The timeline visualization logic remains unchanged */}
                <div className="flex items-center w-full relative">
                    {displayStatuses.map((status, index) => {
                        const isActive = currentIndex >= index;
                        const isLastItem = index === displayStatuses.length - 1;
                        let circleClasses = "bg-gray-200 text-gray-600";
                        let labelClasses = "text-gray-500";
                        let lineClasses = "border-gray-300";

                        if (isActive) {
                            circleClasses = "bg-green-500 text-white";
                            labelClasses = "text-green-600";
                            lineClasses = "border-green-500";

                            if (isLastItem) {
                                if (status === 'rejected') {
                                    circleClasses = "bg-red-500 text-white";
                                    labelClasses = "text-red-600";
                                } else if (status === 'cold') {
                                    circleClasses = "bg-blue-500 text-white";
                                    labelClasses = "text-blue-600";
                                }
                            }
                        }

                        if (index === displayStatuses.length - 2) {
                            const nextStatus = displayStatuses[index + 1];
                            if (nextStatus === 'rejected') {
                                lineClasses = "border-red-500";
                            } else if (nextStatus === 'cold') {
                                lineClasses = "border-blue-500";
                            }
                        }

                        return (
                            <div key={status} className="flex-1 flex flex-col items-center relative">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-semibold z-10 ${circleClasses}`}>
                                    {index + 1}
                                </div>
                                <p className={`mt-2 text-sm font-medium capitalize ${labelClasses}`}>
                                    {status}
                                </p>
                                {index < displayStatuses.length - 1 && (
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
                        selectedKeys={[currentStatus]}
                        onSelectionChange={(keys) => handleStatusChange(Array.from(keys)[0] as string)}
                        className="w-[200px]"
                    >
                        {statuses.map((status) => (
                            <SelectItem key={status} className="capitalize">
                                {status}
                            </SelectItem>
                        ))}
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
                                {reasonOptions.map((opt) => (
                                    <SelectItem key={opt}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </Select>

                            {reason === "Others" && (
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
                        <Button color="primary" onPress={handleConfirmReason} disabled={isConfirmDisabled}>
                            Confirm
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};