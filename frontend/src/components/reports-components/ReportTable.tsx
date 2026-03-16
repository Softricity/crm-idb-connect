"use client";

import { ReportColumnConfig } from "@/types/reports";
import { Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useLayoutEffect, useRef, useState } from "react";

type Props = {
  loading: boolean;
  error: string | null;
  columns: ReportColumnConfig[];
  rows: Record<string, any>[];
};

export default function ReportTable({ loading, error, columns, rows }: Props) {
  const visibleColumns = columns.filter((column) => column.visible);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const [showBottomScrollbar, setShowBottomScrollbar] = useState(false);
  const [maxScrollLeft, setMaxScrollLeft] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useLayoutEffect(() => {
    const tableEl = tableScrollRef.current;
    if (!tableEl) return;

    const updateOverflow = () => {
      const maxLeft = Math.max(tableEl.scrollWidth - tableEl.clientWidth, 0);
      const hasOverflow = maxLeft > 0;
      setShowBottomScrollbar(hasOverflow);
      setMaxScrollLeft(maxLeft);
      setScrollLeft((prev) => Math.min(prev, maxLeft));
    };

    const ro = new ResizeObserver(() => {
      updateOverflow();
    });

    ro.observe(tableEl);
    if (tableEl.firstElementChild instanceof HTMLElement) {
      ro.observe(tableEl.firstElementChild);
    }

    const raf = requestAnimationFrame(updateOverflow);
    window.addEventListener("resize", updateOverflow);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [visibleColumns.length, rows.length]);

  const handleTableScroll = () => {
    const tableEl = tableScrollRef.current;
    if (!tableEl) return;
    setScrollLeft(tableEl.scrollLeft);
  };

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
    <div className="border rounded-xl bg-white h-[67vh] overflow-hidden w-full min-w-0 flex flex-col">
      <div
        ref={tableScrollRef}
        onScroll={handleTableScroll}
        className="flex-1 w-full overflow-x-auto overflow-y-auto"
      >
        <Table removeWrapper aria-label="Report table" className="min-w-max">
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
      {showBottomScrollbar && (
        <div className="border-t bg-white px-3 py-2">
          <input
            type="range"
            min={0}
            max={maxScrollLeft}
            step={1}
            value={Math.min(scrollLeft, maxScrollLeft)}
            onChange={(e) => {
              const next = Number(e.target.value);
              setScrollLeft(next);
              const tableEl = tableScrollRef.current;
              if (tableEl) {
                tableEl.scrollLeft = next;
              }
            }}
            className="w-full h-2 cursor-ew-resize"
            aria-label="Horizontal table scroll"
          />
        </div>
      )}
    </div>
  );
}
