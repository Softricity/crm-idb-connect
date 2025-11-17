"use client";
import React from "react";
import { Followup } from "@/stores/useFollowupStore";
import { Card, CardHeader, CardBody, CardFooter, Chip, Button, Spinner } from "@heroui/react";
import { CheckIcon } from "lucide-react";
import { format } from "date-fns";

interface FollowupListProps {
    followups: Followup[];
    loading: boolean;
    selectedFollowup: Followup | null;
    setSelectedFollowup: (f: Followup) => void;
}

export default function FollowupList({
    followups,
    loading,
    selectedFollowup,
    setSelectedFollowup,
}: FollowupListProps) {
    const getDueDateBadge = (dueDateStr: string | undefined, completed: boolean = false) => {
        if (!dueDateStr) return null;
        const date = new Date(dueDateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (completed) return <></>;
        if (date.toDateString() === today.toDateString()) return <Chip color="danger">Due Today</Chip>;
        if (date.toDateString() === tomorrow.toDateString()) return <Chip color="warning">Due Tomorrow</Chip>;
        return <Chip color="default">Due on {format(date, "dd/MM/yyyy hh:mm a")}</Chip>;
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }

    return (
        <div className="space-y-2">
            {followups.map((followup) => (
                <Card
                    key={followup.id}
                    isPressable
                    onPress={() => setSelectedFollowup(followup)}
                    className={`transition-all ${selectedFollowup?.id === followup.id ? "border-2 border-blue-500" : "hover:shadow-md"} ${followup.completed ? "opacity-75 bg-gray-50" : ""}`}
                >
                    <CardHeader>
                        <p className={`font-medium line-clamp-2 ${followup.completed ? "line-through text-gray-500" : ""}`}>
                            {followup.title}
                        </p>
                    </CardHeader>
                    <CardBody>
                        <p className="text-xs text-gray-500">
                            Created at {format(new Date(followup.created_at!), "dd MMM yyyy HH:mm")} by{" "}
                            <span className="font-semibold text-gray-800">{followup.partner?.name}</span>
                        </p>
                    </CardBody>
                    <CardFooter className="flex justify-between items-center">
                        {getDueDateBadge(followup.due_date, followup.completed)}
                        {followup.completed && (
                            <Chip color="success" variant="flat" startContent={<CheckIcon className="w-3 h-3" />}>
                                Completed
                            </Chip>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
