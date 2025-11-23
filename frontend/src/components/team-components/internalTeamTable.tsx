"use client";

import React, { useEffect, useState } from "react";
import { usePartnerStore, Partner } from "@/stores/usePartnerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBranchStore } from "@/stores/useBranchStore";
import { hasAnyPermission, EmployeePermission } from "@/lib/utils";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Input,
    Chip,
} from "@heroui/react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { InternalTeamCreateUpdate } from "./internalTeamCreateUpdate";

export function InternalTeamTable() {
    const { partners, fetchPartners, deletePartner, loading } = usePartnerStore();
    const { user } = useAuthStore();
    const { selectedBranch } = useBranchStore();
    const userPermissions = user?.permissions || [];
    
    const canCreate = hasAnyPermission(userPermissions, [EmployeePermission.EMPLOYEE_CREATE]);
    const canUpdate = hasAnyPermission(userPermissions, [EmployeePermission.EMPLOYEE_UPDATE]);
    const canDelete = hasAnyPermission(userPermissions, [EmployeePermission.EMPLOYEE_DELETE]);
    
    const [search, setSearch] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Partner | null>(null);

    useEffect(() => {
        fetchPartners(selectedBranch?.id);
    }, [fetchPartners, selectedBranch]);

    // Filter internal team members (exclude external agents)
    const internalTeam = React.useMemo(
        () =>
            partners.filter(
                (p) => p.role?.toLowerCase() !== "agent" && p.name?.toLowerCase().includes(search.toLowerCase())
            ),
        [partners, search]
    );

    const handleEdit = (member: Partner) => {
        setSelectedMember(member);
        setIsCreateModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this team member?")) return;
        
        try {
            await deletePartner(id);
            toast.success("Team member deleted successfully");
        } catch (error) {
            toast.error("Failed to delete team member");
            console.error(error);
        }
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setSelectedMember(null);
    };

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex items-center justify-between gap-4">
                <Input
                    placeholder="Search team members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    startContent={<Search className="h-4 w-4 text-gray-400" />}
                    className="max-w-xs"
                />
                {canCreate && (
                    <Button
                        color="primary"
                        startContent={<Plus className="h-4 w-4" />}
                        onPress={() => setIsCreateModalOpen(true)}
                    >
                        Add Team Member
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table aria-label="Internal team members table">
                    <TableHeader>
                        <TableColumn>NAME</TableColumn>
                        <TableColumn>EMAIL</TableColumn>
                        <TableColumn>MOBILE</TableColumn>
                        <TableColumn>ROLE</TableColumn>
                        <TableColumn>CITY</TableColumn>
                        <TableColumn>STATE</TableColumn>
                        <TableColumn align="center">ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody
                        items={internalTeam}
                        isLoading={loading}
                        emptyContent="No team members found"
                    >
                        {(member) => (
                            <TableRow key={member.id}>
                                <TableCell>
                                    <div className="font-medium">{member.name}</div>
                                </TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>{member.mobile}</TableCell>
                                <TableCell>
                                    <Chip size="sm" variant="flat" color="primary">
                                        {member?.role || "No Role"}
                                    </Chip>
                                </TableCell>
                                <TableCell>{member.city}</TableCell>
                                <TableCell>{member.state}</TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-2">
                                        {canUpdate && (
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                onPress={() => handleEdit(member)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {canDelete && (
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                color="danger"
                                                onPress={() => handleDelete(member.id!)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create/Update Modal */}
            <InternalTeamCreateUpdate
                isOpen={isCreateModalOpen}
                onOpenChange={handleCloseModal}
                member={selectedMember}
            />
        </div>
    );
}
