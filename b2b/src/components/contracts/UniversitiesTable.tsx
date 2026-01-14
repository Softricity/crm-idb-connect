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
  Spinner,
} from "@heroui/react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface University {
  id: string;
  name: string;
  city?: string;
  country?: {
    id: string;
    name: string;
    flag?: string;
  };
  logo?: string;
  website?: string;
  _count?: {
    courses: number;
  };
  created_at?: string;
  updated_at?: string;
}

interface UniversitiesTableProps {
  universities: University[];
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
}

export default function UniversitiesTable({
  universities,
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  sortBy,
  sortOrder = 'desc',
  onSort,
}: UniversitiesTableProps) {

  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  const columns = [
    { key: "name", label: "UNIVERSITY NAME", sortable: true },
    { key: "city", label: "CITY", sortable: true },
    { key: "country", label: "COUNTRY", sortable: true },
    { key: "courses", label: "NO. OF COURSES", sortable: true },
    { key: "website", label: "WEBSITE", sortable: false },
  ];

  const renderCell = (university: University, columnKey: React.Key) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            {university.logo && (
              <img 
                src={university.logo} 
                alt={university.name}
                className="w-8 h-8 rounded object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="text-sm font-semibold">{university.name}</span>
          </div>
        );

      case "city":
        return <span className="text-sm">{university.city || "-"}</span>;

      case "country":
        return (
          <div className="flex items-center gap-2">
            {university.country?.flag && (
              <span className="text-lg">{university.country.flag}</span>
            )}
            <span className="text-sm">{university.country?.name || "-"}</span>
          </div>
        );

      case "courses":
        return (
          <Chip
            color="primary"
            radius="sm"
            size="sm"
            variant="flat"
          >
            {university._count?.courses || 0}
          </Chip>
        );

      case "website":
        return university.website ? (
          <a
            href={university.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Visit Website
          </a>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );

      default:
        return "-";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (universities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg font-semibold">No universities found</p>
        <p className="text-sm mt-2">Try adjusting your search</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table
        aria-label="Universities table"
        classNames={{
          wrapper: "shadow-md",
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn 
              key={column.key} 
              className="uppercase text-xs"
            >
              {column.sortable && onSort ? (
                <button
                  onClick={() => onSort(column.key)}
                  className="flex items-center hover:text-primary transition-colors font-semibold"
                >
                  {column.label}
                  {renderSortIcon(column.key)}
                </button>
              ) : (
                <span className="font-semibold">{column.label}</span>
              )}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={universities}>
          {(university) => (
            <TableRow
              key={university.id}
              className="hover:bg-gray-50 transition-colors"
            >
              {(columnKey) => <TableCell>{renderCell(university, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
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
}
