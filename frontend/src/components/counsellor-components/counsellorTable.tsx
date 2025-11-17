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
import { CounsellorForm } from "./counsellorCreateUpdate";

export function CounsellorTable() {
    const { partners, fetchPartners, deletePartner, loading } = usePartnerStore();
    const { isOpen, onOpen, onOpenChange } = useDisclosure(); // For delete modal

    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [selectedCounsellor, setSelectedCounsellor] = React.useState<Partner | undefined>(undefined);
    const [counsellorToDelete, setCounsellorToDelete] = React.useState<Partner | null>(null);
    const [search, setSearch] = React.useState("");

    // Pagination states
    const [page, setPage] = React.useState(1);
    const rowsPerPage = 10;

    React.useEffect(() => {
        fetchPartners();
    }, [fetchPartners]);

    const counsellors = React.useMemo(
        () =>
            partners.filter(
                (p) => p.role === "counsellor" && p.name?.toLowerCase().includes(search.toLowerCase())
            ),
        [partners, search]
    );

    const paginatedCounsellors = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return counsellors.slice(start, start + rowsPerPage);
    }, [counsellors, page]);

    const totalPages = Math.ceil(counsellors.length / rowsPerPage);

    const handleEdit = (counsellor: Partner) => {
        setSelectedCounsellor(counsellor);
        setIsSheetOpen(true);
    };

    const handleAddNew = () => {
        setSelectedCounsellor(undefined);
        setIsSheetOpen(true);
    };

    const handleDeletePress = (counsellor: Partner) => {
        setCounsellorToDelete(counsellor);
        onOpen();
    };

    const handleDeleteConfirm = async () => {
        if (!counsellorToDelete?.id) return;
        try {
            await deletePartner(counsellorToDelete.id);
            toast.success("Counsellor deleted successfully.");
        } catch (error) {
            toast.error("Failed to delete counsellor.");
        } finally {
            setCounsellorToDelete(null);
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
                <Button className="shadow-sm bg-[#AC32EF] text-white hover:cursor-pointer" endContent={<PlusCircle className="h-4 w-4" />} onPress={handleAddNew}>
                    Add New Counsellor
                </Button>
            </div>

            <Table
                aria-label="Counsellor data table"
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
                    <TableColumn>City</TableColumn>
                    <TableColumn>Actions</TableColumn>
                </TableHeader>
                <TableBody items={paginatedCounsellors} isLoading={loading} emptyContent={"No counsellors found."}>
                    {(counsellor) => (
                        <TableRow key={counsellor.id}>
                            <TableCell>{counsellor.name}</TableCell>
                            <TableCell>{counsellor.email}</TableCell>
                            <TableCell>{counsellor.mobile}</TableCell>
                            <TableCell>{counsellor.city}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="bordered" onPress={() => handleEdit(counsellor)}>
                                        Edit
                                    </Button>
                                    <Button size="sm" color="danger" variant="bordered" onPress={() => handleDeletePress(counsellor)}>
                                        Delete
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <CounsellorForm counsellor={selectedCounsellor} open={isSheetOpen} onOpenChange={setIsSheetOpen} />

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Are you absolutely sure?</ModalHeader>
                            <ModalBody>
                                <p>This will permanently delete the counsellor and cannot be undone.</p>
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
