"use client";

import { ReportColumnConfig } from "@/types/reports";
import { Button, Checkbox, CheckboxGroup, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Props = {
  storageKey: string;
  columns: ReportColumnConfig[];
  onChange: (columns: ReportColumnConfig[]) => void;
};

export default function ManageColumnsPopover({ storageKey, columns, onChange }: Props) {
  const [localColumns, setLocalColumns] = useState(columns);

  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as ReportColumnConfig[];
      const merged = columns.map((col) => {
        const found = parsed.find((item) => item.key === col.key);
        return found ? { ...col, visible: found.visible || !!col.mandatory } : col;
      });
      setLocalColumns(merged);
      onChange(merged);
    } catch {}
    // Intentionally only on storage key changes to avoid parent-child render loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const selected = useMemo(
    () => localColumns.filter((column) => column.visible).map((column) => column.key),
    [localColumns],
  );

  const handleChange = (keys: string[]) => {
    const next = localColumns.map((column) => ({
      ...column,
      visible: column.mandatory ? true : keys.includes(column.key),
    }));
    setLocalColumns(next);
    onChange(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Button variant="bordered" className="rounded-2xl" size="sm" startContent={<Settings2 size={16} />}>
          Manage Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-4 w-72">
        <div className="w-full space-y-3">
          <p className="text-sm font-semibold">Visible Columns</p>
          <CheckboxGroup value={selected} onValueChange={handleChange}>
            {localColumns.map((column) => (
              <Checkbox key={column.key} value={column.key} isDisabled={!!column.mandatory}>
                <span className="text-sm">
                  {column.label}
                  {column.mandatory ? " (Required)" : ""}
                </span>
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
