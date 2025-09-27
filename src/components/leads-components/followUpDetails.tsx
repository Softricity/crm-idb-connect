"use client";
import React from "react";
import { Followup } from "@/stores/useFollowupStore";
import { Button, Chip, Textarea, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { CheckIcon, RotateCcwIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, Send } from "lucide-react";
import { format } from "date-fns";

interface FollowupDetailsProps {
    followup: Followup;
    leadName: string;
    leadPhone: string;
    userId: string | undefined;
    newComment: string;
    setNewComment: (val: string) => void;
    handleAddComment: () => void;
    handleMarkComplete: (id: string) => void;
    handleReopenFollowup: (id: string) => void;
    openEditModal: (f: Followup) => void;
    handleDeleteFollowup: (id: string) => void;
}

export default function FollowupDetails({
    followup,
    leadName,
    leadPhone,
    userId,
    newComment,
    setNewComment,
    handleAddComment,
    handleMarkComplete,
    handleReopenFollowup,
    openEditModal,
    handleDeleteFollowup
}: FollowupDetailsProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="pb-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold">
                            {leadName} <span className="text-gray-500 font-normal">({leadPhone})</span>
                        </h3>
                        <p className={`mt-1 ${followup.completed ? "line-through text-gray-500" : ""}`}>{followup.title}</p>
                        <p className="text-xs text-gray-500 mt-2">
                            Created by <span className="font-semibold text-gray-800">
                                {followup.partner?.name}{followup.created_by === userId ? " (You)" : ""}
                            </span> at {format(new Date(followup.created_at!), "dd MMM yyyy HH:mm")}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {followup.completed ? (
                            <Chip color="success" size="lg" variant="flat"><CheckIcon className="w-4 h-4 mr-1"/>Completed</Chip>
                        ) : (
                            <Chip color="warning" size="lg">{format(new Date(followup.due_date!), "dd MMMM yyyy hh:mm a")}</Chip>
                        )}
                        <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                                <Button isIconOnly variant="light" radius="full" className="hover:bg-gray-100">
                                    <EllipsisVerticalIcon className="h-5 w-5 text-gray-600"/>
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Followup actions" variant="faded">
                                <DropdownItem key={"edit"} startContent={<PencilIcon className="h-4 w-4 text-blue-500"/>} onPress={() => openEditModal(followup)}>Edit Followup</DropdownItem>
                                <DropdownItem key={"delete"} className="text-danger" color="danger" startContent={<TrashIcon className="h-4 w-4 text-red-500"/>} onPress={() => handleDeleteFollowup(followup.id!)}>Delete Followup</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    {!followup.completed && (
                        <Button startContent={<CheckIcon className="h-4 w-4" />} onClick={() => handleMarkComplete(followup.id!)} color="success">Mark Complete</Button>
                    )}
                    {followup.completed && (
                        <Button variant="bordered" startContent={<RotateCcwIcon className="h-4 w-4" />} onClick={() => handleReopenFollowup(followup.id!)} color="warning">Reopen Followup</Button>
                    )}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto py-4 space-y-4">
                {followup.comments && followup.comments.length > 0 ? (
                    followup.comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-white rounded-lg shadow-sm border">
                            <p className="text-sm">{comment.text}</p>
                            <p className="text-xs text-gray-500 mt-1 text-right">
                                {format(new Date(comment.created_at!), "dd MMM, hh:mm a")}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="flex justify-center items-center h-full text-gray-500">No comments yet</div>
                )}
            </div>

            {!followup.completed && (
                <div className="mt-auto pt-4 border-t border-gray-200 relative">
                    <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        minRows={3}
                        onKeyDown={(e) => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); handleAddComment(); } }}
                    />
                    <Tooltip content="Send">
                        <Button isIconOnly size="sm" className="absolute bottom-2 right-2" onClick={handleAddComment} isDisabled={!newComment.trim()}>
                            <Send className="h-5 w-5"/>
                        </Button>
                    </Tooltip>
                </div>
            )}

            {followup.completed && (
                <div className="mt-auto pt-4 border-t border-gray-200 text-center text-gray-500 py-4">
                    <CheckIcon className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>This followup is completed. Comments are disabled.</p>
                    <p className="text-sm">Use "Reopen Followup" to add more comments.</p>
                </div>
            )}
        </div>
    );
}
