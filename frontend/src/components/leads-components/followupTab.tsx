"use client";
import React, { useState, useEffect } from "react";
import { useFollowupStore, Followup } from "@/stores/useFollowupStore";
import { useAuthStore } from "@/stores/useAuthStore";
import FollowupList from "./followUpList";
import FollowupDetails from "./followUpDetails";
import FollowupModal from "./followUpModal";
import { Button } from "@heroui/react";
import { PlusIcon } from "lucide-react";

interface FollowUpComponentProps {
    leadId: string;
    leadName: string;
    leadPhone: string;
}

export default function FollowUpComponent({ leadId, leadName, leadPhone }: FollowUpComponentProps) {
    const { followups, loading, fetchFollowupsByLeadId, addFollowup, updateFollowup, markComplete, addComment, deleteFollowup, deleteAllCommentsForFollowup } = useFollowupStore();
    const { user } = useAuthStore();

    const [selectedFollowup, setSelectedFollowup] = useState<Followup | null>(null);
    const [newComment, setNewComment] = useState("");
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [followupTitle, setFollowupTitle] = useState("");
    const [editingFollowupId, setEditingFollowupId] = useState<string | null>(null);
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [customDueDate, setCustomDueDate] = useState<string>("");

    useEffect(()=>{ fetchFollowupsByLeadId(leadId); }, [leadId]);

    useEffect(()=>{
        if(followups.length>0 && !selectedFollowup) setSelectedFollowup(followups[0]);
    }, [followups]);

    useEffect(()=>{
        if(selectedFollowup){
            const updated = followups.find(f=>f.id===selectedFollowup.id);
            if(updated && updated!==selectedFollowup) setSelectedFollowup(updated);
        }
    }, [followups]);

    const openCreateModal = ()=>{
        setModalMode("create"); setFollowupTitle(""); setDueDate(null); setCustomDueDate(""); setEditingFollowupId(null); setModalOpen(true);
    };

    const openEditModal = (followup: Followup)=>{
        setModalMode("edit"); setFollowupTitle(followup.title); setEditingFollowupId(followup.id!);
        if(followup.due_date){ const d = new Date(followup.due_date); setDueDate(d); setCustomDueDate(d.toISOString().slice(0,10)); }
        setModalOpen(true);
    };

    const handleSubmit = async ()=>{
        if(!followupTitle.trim() || !dueDate) return;

        if(modalMode==="create"){
            await addFollowup({ title: followupTitle, lead_id: leadId, completed:false, created_by:user?.id??"", due_date:dueDate.toISOString(), created_at:new Date().toISOString() });
        } else if(modalMode==="edit" && editingFollowupId){
            await updateFollowup(editingFollowupId, { title:followupTitle, due_date:dueDate.toISOString() });
            const updated = followups.find(f=>f.id===editingFollowupId);
            if(updated) setSelectedFollowup(updated);
        }

        setModalOpen(false); setFollowupTitle(""); setDueDate(null); setCustomDueDate(""); setEditingFollowupId(null); setModalMode("create");
    };

    const handleAddComment = async ()=>{
        if(!newComment.trim() || !selectedFollowup || selectedFollowup.completed) return;
        await addComment({ text:newComment, followup_id:selectedFollowup.id!, created_by:user?.id??"" });
        await fetchFollowupsByLeadId(leadId); setNewComment("");
    };

    const handleMarkComplete = async (id:string)=>{
        await markComplete(id);
        if(selectedFollowup?.id===id){ const updated = followups.find(f=>f.id===id); if(updated) setSelectedFollowup({...updated, completed:true}); }
    };

    const handleReopenFollowup = async (id:string)=>{
        await updateFollowup(id, { completed:false });
        if(selectedFollowup?.id===id){ const updated = followups.find(f=>f.id===id); if(updated) setSelectedFollowup({...updated, completed:false}); }
    };

    const handleDeleteFollowup = async (id:string)=>{
        try{ await deleteAllCommentsForFollowup(id); await deleteFollowup(id);
            if(selectedFollowup?.id===id){ setSelectedFollowup(followups.length>1 ? followups.find(f=>f.id!==id)||null : null); }
        } catch(e){ console.error(e); alert("Failed to delete followup."); }
    };

    return (
        <div className="flex bg-gray-50 font-sans">
            <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Follow Ups</h3>
                    <Button startContent={<PlusIcon className="h-5 w-5"/>} onClick={openCreateModal} color="primary">Create</Button>
                </div>
                <FollowupList followups={followups} loading={loading} selectedFollowup={selectedFollowup} setSelectedFollowup={setSelectedFollowup}/>
            </div>
            <div className="w-2/3 p-6 flex flex-col">
                {selectedFollowup ? <FollowupDetails
                    followup={selectedFollowup} leadName={leadName} leadPhone={leadPhone} userId={user?.id}
                    newComment={newComment} setNewComment={setNewComment} handleAddComment={handleAddComment}
                    handleMarkComplete={handleMarkComplete} handleReopenFollowup={handleReopenFollowup}
                    openEditModal={openEditModal} handleDeleteFollowup={handleDeleteFollowup}
                /> : <div className="flex justify-center items-center h-full text-gray-500">Select a follow-up to see details.</div>}
            </div>
            <FollowupModal
                isOpen={isModalOpen} onOpenChange={setModalOpen} mode={modalMode}
                followupTitle={followupTitle} setFollowupTitle={setFollowupTitle}
                dueDate={dueDate} setDueDate={setDueDate}
                customDueDate={customDueDate} setCustomDueDate={setCustomDueDate}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
