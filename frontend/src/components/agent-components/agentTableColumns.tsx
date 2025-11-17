"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Partner } from "@/stores/usePartnerStore";

// The actions cell component remains encapsulated
function CellActions({
  agent,
  onEdit,
  onDeletePress,
}: {
  agent: Partner;
  onEdit: (agent: Partner) => void;
  onDeletePress: (agent: Partner) => void;
}) {
  return (
    <div className="relative flex justify-end items-center gap-2">
      <Dropdown>
        <DropdownTrigger>
          <Button isIconOnly size="sm" variant="light">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu>
          <DropdownItem key="edit" onPress={() => onEdit(agent)}>Edit Agent</DropdownItem>
          <DropdownItem key="delete" onPress={() => onDeletePress(agent)} className="text-danger" color="danger">
            Delete Agent
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}

// getColumns is a function that accepts handlers, making it reusable and clean
export const getColumns = (
  onEdit: (agent: Partner) => void,
  onDeletePress: (agent: Partner) => void
): ColumnDef<Partner>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="light" onPress={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
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
    cell: ({ row }) => <CellActions agent={row.original} onEdit={onEdit} onDeletePress={onDeletePress} />,
  },
];