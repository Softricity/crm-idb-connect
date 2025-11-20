"use client";

import React from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Pagination,
} from "@heroui/react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { usePartnerStore, Partner } from "@/stores/usePartnerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { hasAnyPermission, AgentsPermission } from "@/lib/utils";
import { AgentForm } from "./agentCreateUpdate";

export function AgentTable() {
    const { partners, fetchPartners, deletePartner, loading } = usePartnerStore();
    const { user } = useAuthStore();
    const userPermissions = user?.permissions || [];
    
    const canCreate = hasAnyPermission(userPermissions, [AgentsPermission.AGENTS_CREATE]);
    const canUpdate = hasAnyPermission(userPermissions, [AgentsPermission.AGENTS_UPDATE]);
    const canDelete = hasAnyPermission(userPermissions, [AgentsPermission.AGENTS_DELETE]);
    
    const { isOpen, onOpen, onOpenChange } = useDisclosure(); // For delete modal

    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [selectedAgent, setSelectedAgent] = React.useState<Partner | undefined>(undefined);
    const [agentToDelete, setAgentToDelete] = React.useState<Partner | null>(null);
    const [search, setSearch] = React.useState("");

    // Pagination states
    const [page, setPage] = React.useState(1);
    const rowsPerPage = 10;

    React.useEffect(() => {
        fetchPartners();
    }, [fetchPartners]);

    const agents = React.useMemo(
        () =>
            partners.filter(
                (p) => p.role?.toLowerCase() === "agent" && p.name?.toLowerCase().includes(search.toLowerCase())
            ),
        [partners, search]
    );

    const paginatedAgents = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return agents.slice(start, start + rowsPerPage);
    }, [agents, page]);

    const totalPages = Math.ceil(agents.length / rowsPerPage);

    const handleEdit = (agent: Partner) => {
        setSelectedAgent(agent);
        setIsSheetOpen(true);
    };

    const handleAddNew = () => {
        setSelectedAgent(undefined);
        setIsSheetOpen(true);
    };

    const handleDeletePress = (agent: Partner) => {
        setAgentToDelete(agent);
        onOpen();
    };

    const handleDeleteConfirm = async () => {
        if (!agentToDelete?.id) return;
        try {
            await deletePartner(agentToDelete.id);
            toast.success("Agent deleted successfully.");
        } catch (error) {
            toast.error("Failed to delete agent.");
        } finally {
            setAgentToDelete(null);
        }
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <Input
                    isClearable
                    placeholder="Filter by name..."
                    value={search}
                    onValueChange={setSearch}
                    className="max-w-sm"
                />
                {canCreate && (
                    <Button className="shadow-sm bg-[#AC32EF] text-white hover:cursor-pointer" endContent={<PlusCircle className="h-4 w-4" />} onPress={handleAddNew}>
                        Add New Agent
                    </Button>
                )}
            </div>

            <Table
                aria-label="Agent data table"
                bottomContent={
                    totalPages > 1 && (
                        <div className="flex w-full justify-center">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={page}
                                total={totalPages}
                                onChange={setPage}
                            />
                        </div>
                    )
                }
            >
                <TableHeader>
                    <TableColumn>Name</TableColumn>
                    <TableColumn>Email</TableColumn>
                    <TableColumn>Phone</TableColumn>
                    <TableColumn>Agency</TableColumn>
                    <TableColumn>Actions</TableColumn>
                </TableHeader>
                <TableBody items={paginatedAgents} isLoading={loading} emptyContent={"No agents found."}>
                    {(agent) => (
                        <TableRow key={agent.id}>
                            <TableCell>{agent.name}</TableCell>
                            <TableCell>{agent.email}</TableCell>
                            <TableCell>{agent.mobile}</TableCell>
                            <TableCell>{agent.agency_name}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="bordered" onPress={() => handleEdit(agent)}>
                                        Edit
                                    </Button>
                                    <Button size="sm" color="danger" variant="bordered" onPress={() => handleDeletePress(agent)}>
                                        Delete
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <AgentForm agent={selectedAgent} open={isSheetOpen} onOpenChange={setIsSheetOpen} />

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Are you absolutely sure?</ModalHeader>
                            <ModalBody>
                                <p>This will permanently delete the agent and cannot be undone.</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="danger"
                                    onPress={() => {
                                        handleDeleteConfirm();
                                        onClose();
                                    }}
                                >
                                    Continue
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}