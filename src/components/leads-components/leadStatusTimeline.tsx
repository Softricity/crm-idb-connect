import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const statuses = ["new", "engaged", "hot", "assigned", "cold", "rejected"];

export default function StatusTimeline ({
    currentStatus,
    onChange,
}: {
    currentStatus: string;
    onChange: (status: string) => void;
})  {
    const currentIndex = statuses.findIndex(
        (status) => status.toLowerCase() === currentStatus.toLowerCase()
    );

    return (
        <div className="flex items-center justify-between w-full p-6 bg-white rounded-lg shadow">
            <div className="flex items-center w-full relative">
                {statuses.map((status, index) => {
                    const isActive = index <= currentIndex;
                    return (
                        <div key={status} className="flex-1 flex flex-col items-center relative">
                            {/* Circle */}
                            <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center font-semibold z-10 ${isActive ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                                    }`}
                            >
                                {index + 1}
                            </div>

                            {/* Label */}
                            <p className={`mt-2 text-sm font-medium ${isActive ? "text-green-600" : "text-gray-500"}`}>
                                {status}
                            </p>

                            {/* Dotted Line */}
                            {index < statuses.length - 1 && (
                                <div
                                    className={`absolute top-5 left-1/2 w-full h-0.5 border-t-2 border-dotted ${isActive ? "border-green-500" : "border-gray-300"
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="ml-8">
                <Select value={currentStatus} onValueChange={onChange}>
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
    );
};
