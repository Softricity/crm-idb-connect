
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Partner, usePartnerStore } from "@/stores/usePartnerStore"; 
import { useAuthStore } from "@/stores/useAuthStore";
import { hasAnyPermission, AgentsPermission } from "@/lib/utils";

interface CellActionsProps {
    agent: Partner; 
    onEdit: (agent: Partner) => void; 
}

function CellActions({ agent, onEdit }: CellActionsProps) {
    const { deletePartner } = usePartnerStore(); 
    const { user } = useAuthStore();
    const userPermissions = user?.permissions || [];
    
    const canUpdate = hasAnyPermission(userPermissions, [AgentsPermission.AGENTS_UPDATE]);
    const canDelete = hasAnyPermission(userPermissions, [AgentsPermission.AGENTS_DELETE]);

    if (!canUpdate && !canDelete) {
        return null; // Don't show menu if no permissions
    } 

    const handleDelete = async () => {
        if (!agent.id) return;
        try {
            await deletePartner(agent.id); 
            toast.success("Agent deleted successfully.");
        } catch (error) {
            toast.error("Failed to delete agent.");
        }
    };

    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {canUpdate && (
                        <DropdownMenuItem onClick={() => onEdit(agent)}>
                            Edit Agent
                        </DropdownMenuItem>
                    )}
                    {canUpdate && canDelete && <DropdownMenuSeparator />}
                    {canDelete && (
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-600">
                                Delete Agent
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        agent and remove their data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export const getColumns = (
    onEdit: (agent: Partner) => void 
): ColumnDef<Partner>[] => [ 
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "mobile",
            header: "Mobile",
        },
        {
            accessorKey: "agency_name",
            header: "Agency Name",
        },
        {
            accessorKey: "city",
            header: "City",
        },
        {
            accessorKey: "state",
            header: "State",
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const agent = row.original;
                return <CellActions agent={agent} onEdit={onEdit} />;
            },
        },
    ];