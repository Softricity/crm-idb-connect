"use client";

import { REPORT_DEFINITIONS } from "@/config/reports";
import { useReportStore } from "@/stores/useReportStore";
import { ReportColumnConfig, ReportType } from "@/types/reports";
import { useBranchStore } from "@/stores/useBranchStore";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import ManageColumnsPopover from "./ManageColumnsPopover";
import ReportFiltersPanel from "./ReportFiltersPanel";
import ReportTable from "./ReportTable";
import { toast } from "sonner";

const LAST_VISITED_KEY = "crm_reports_last_visited";

function makeDefaultColumns(type: ReportType): ReportColumnConfig[] {
  return REPORT_DEFINITIONS[type].columns.map((column) => ({
    key: column.key,
    label: column.label,
    mandatory: !!column.mandatory,
    visible: column.mandatory ? true : (column.defaultVisible ?? true),
  }));
}

function columnsStorageKey(type: ReportType) {
  return `reports_columns_${type}_v1`;
}

export default function ReportPageView({ type }: { type: ReportType }) {
  const definition = REPORT_DEFINITIONS[type];
  const branchId = useBranchStore((state) => state.selectedBranch?.id) ?? null;

  const {
    items,
    total,
    loading,
    filtersLoading,
    error,
    filterOptions,
    query,
    setPage,
    setPageSize,
    setSearch,
    setSort,
    setFilters,
    clearFilters,
    fetchData,
    fetchFilterOptions,
    downloadXlsx,
  } = useReportStore();

  const [columns, setColumns] = useState<ReportColumnConfig[]>(() => makeDefaultColumns(type));

  useEffect(() => {
    setColumns(makeDefaultColumns(type));
  }, [type]);

  useEffect(() => {
    const current = typeof window !== "undefined" ? localStorage.getItem(LAST_VISITED_KEY) : null;
    const map = current ? JSON.parse(current) : {};
    map[type] = new Date().toISOString();
    localStorage.setItem(LAST_VISITED_KEY, JSON.stringify(map));
  }, [type]);

  useEffect(() => {
    setSort(definition.defaultSortBy, definition.defaultSortOrder);
  }, [definition.defaultSortBy, definition.defaultSortOrder, setSort]);

  useEffect(() => {
    fetchFilterOptions(type, branchId);
  }, [type, branchId, fetchFilterOptions]);

  useEffect(() => {
    fetchData(type, branchId);
  }, [type, branchId, query.page, query.pageSize, query.sortBy, query.sortOrder, query.search, query.filters, fetchData]);

  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const start = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const end = Math.min(total, query.page * query.pageSize);

  const filtersActiveCount = useMemo(
    () => Object.values(query.filters).reduce((sum, arr) => sum + arr.length, 0),
    [query.filters],
  );

  const handleDownload = async () => {
    try {
      await downloadXlsx(type, columns, branchId);
    } catch (e) {
      toast.error("Failed to export report");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-4xl font-bold">{definition.title}</h1>
        <div className="flex items-center gap-2">
          <ManageColumnsPopover
            storageKey={columnsStorageKey(type)}
            columns={columns}
            onChange={setColumns}
          />
          <Button variant="bordered" className="rounded-2xl" size="sm" onPress={handleDownload} startContent={<Download size={16} />}>
            Download
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search..."
          value={query.search ?? ""}
          onValueChange={(value) => setSearch(value)}
          className="max-w-md"
        />
        <Select
          size="sm"
          selectedKeys={[String(query.pageSize)]}
          onSelectionChange={(keys) => {
            const value = Number(Array.from(keys)[0] ?? 25);
            setPageSize(value);
          }}
          className="w-36"
          aria-label="Rows per page"
        >
          <SelectItem key="25">25 / page</SelectItem>
          <SelectItem key="50">50 / page</SelectItem>
          <SelectItem key="100">100 / page</SelectItem>
        </Select>
        <span className="text-sm text-gray-500">{filtersActiveCount} filter(s) applied</span>
        {filtersLoading && <span className="text-sm text-gray-500">Loading filters...</span>}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <ReportFiltersPanel
          sections={definition.filters}
          options={filterOptions}
          selected={query.filters}
          onChange={setFilters}
          onClear={clearFilters}
        />

        <div className="flex-1 space-y-3">
          <ReportTable loading={loading} error={error} columns={columns} rows={items} />
          <div className="flex items-center justify-between text-sm">
            <span>Showing {start} to {end} of {total} records</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="light" isDisabled={query.page <= 1} onPress={() => setPage(query.page - 1)}>Prev</Button>
              <span>Page {query.page} of {pageCount}</span>
              <Button size="sm" variant="light" isDisabled={query.page >= pageCount} onPress={() => setPage(query.page + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
