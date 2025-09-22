import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

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
        if (newStatus === "cold" || newStatus === "rejected") {
            setPendingStatus(newStatus);
            setIsReasonDialogOpen(true);
        } else {
            setCurrentStatus(newStatus);
            onChange(newStatus);
        }
    };

    const handleConfirmReason = () => {
        const finalReason =
            reason === "Others" ? otherReasonText : reason;
        if (finalReason && pendingStatus) {
            setCurrentStatus(pendingStatus);
            onChange(pendingStatus, finalReason);
        }
    };

    const handleDialogClose = () => {
        setPendingStatus("");
        setReason("");
        setOtherReasonText("");
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
                    <Select value={currentStatus} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[200px] min-h-[3rem] flex items-center py-2 px-3 text-left hover:ring-1 hover:cursor-pointer focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <div className="flex flex-col justify-center h-[2rem] gap-2">
                                <p className="text-xs text-muted-foreground capitalize">Change Status</p>
                                <SelectValue placeholder="Select a status" className="capitalize" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {statuses.map((status) => (
                                <SelectItem key={status} value={status} className="capitalize">
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <AlertDialog open={isReasonDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) handleDialogClose(); setIsReasonDialogOpen(isOpen); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="capitalize">Select Reason for '{pendingStatus}' Status</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please provide a reason for this status change.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4 space-y-4">
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a reason..." />
                            </SelectTrigger>
                            <SelectContent>
                                {reasonOptions.map((reason) => (
                                    <SelectItem key={reason} value={reason}>
                                        {reason}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {reason === "Others" && (
                            <Textarea
                                placeholder="Please specify the reason"
                                value={otherReasonText}
                                onChange={(e) => setOtherReasonText(e.target.value)}
                                className="min-h-[100px]"
                            />
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmReason} disabled={isConfirmDisabled}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
