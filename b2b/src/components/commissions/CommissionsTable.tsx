"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Pagination,
} from "@heroui/react";
import { format } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface Commission {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  remarks?: string;
  created_at: string;
  lead?: {
    id: string;
    name: string;
    email: string;
  };
  application?: {
    id: string;
  };
}

const statusColorMap: {
  [key: string]: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
} = {
  PAID: "success",
  APPROVED: "primary",
  PENDING: "warning",
  REJECTED: "danger",
};

interface CommissionsTableProps {
  commissions: Commission[];
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
}

const CommissionsTable: React.FC<CommissionsTableProps> = ({
  commissions,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  sortBy = 'created_at',
  sortOrder = 'desc',
  onSort,
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 ml-1 inline" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 inline" />
      : <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  const handleSort = (columnKey: string) => {
    if (onSort) {
      onSort(columnKey);
    }
  };

  return (
    <div className="space-y-4">
      <Table
        aria-label="Commissions table"
        classNames={{
          wrapper: "shadow-md rounded-lg",
          th: "bg-gray-50 text-gray-700 font-semibold",
          td: "text-gray-800",
        }}
      >
        <TableHeader>
          <TableColumn
            key="created_at"
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('created_at')}
          >
            <div className="flex items-center">
              Date
              {renderSortIcon('created_at')}
            </div>
          </TableColumn>
          <TableColumn key="lead">Lead/Application</TableColumn>
          <TableColumn
            key="amount"
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('amount')}
          >
            <div className="flex items-center">
              Amount
              {renderSortIcon('amount')}
            </div>
          </TableColumn>
          <TableColumn
            key="status"
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('status')}
          >
            <div className="flex items-center">
              Status
              {renderSortIcon('status')}
            </div>
          </TableColumn>
          <TableColumn key="remarks">Remarks</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No commissions found">
          {commissions.map((commission) => (
            <TableRow key={commission.id} className="hover:bg-gray-50">
              <TableCell>
                <span className="text-sm font-medium">
                  {formatDate(commission.created_at)}
                </span>
              </TableCell>
              <TableCell>
                {commission.lead && (
                  <div>
                    <p className="font-medium text-gray-900">{commission.lead.name}</p>
                    <p className="text-sm text-gray-500">{commission.lead.email}</p>
                  </div>
                )}
                {commission.application && (
                  <p className="text-sm text-gray-500">
                    Application: {commission.application.id.slice(0, 8)}...
                  </p>
                )}
              </TableCell>
              <TableCell>
                <span className="font-semibold text-gray-900">
                  {commission.currency} {commission.amount.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <Chip
                  color={statusColorMap[commission.status] || "default"}
                  variant="flat"
                  size="sm"
                >
                  {commission.status}
                </Chip>
              </TableCell>
              <TableCell>
                <p className="text-sm text-gray-600 max-w-xs truncate">
                  {commission.remarks || '-'}
                </p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={onPageChange}
            showControls
            color="primary"
          />
        </div>
      )}
    </div>
  );
};

export default CommissionsTable;
