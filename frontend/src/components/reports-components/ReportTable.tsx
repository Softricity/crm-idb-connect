"use client";

import { ReportColumnConfig } from "@/types/reports";
import { Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";

type Props = {
  loading: boolean;
  error: string | null;
  columns: ReportColumnConfig[];
  rows: Record<string, any>[];
};

export default function ReportTable({ loading, error, columns, rows }: Props) {
  const visibleColumns = columns.filter((column) => column.visible);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center border rounded-xl bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="border rounded-xl p-6 bg-white text-red-600">{error}</div>;
  }

  return (
    <div className="border rounded-xl bg-white overflow-auto h-[67vh]">
      <Table removeWrapper aria-label="Report table" className="min-w-[900px]">
        <TableHeader columns={visibleColumns}>
          {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
        </TableHeader>
        <TableBody items={rows} emptyContent={"No records found."}>
          {(item) => (
            <TableRow key={item.id || item.serial_no}>
              {(columnKey) => <TableCell className="text-nowrap">{String(item[columnKey as string] ?? "-")}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
