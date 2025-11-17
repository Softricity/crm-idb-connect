"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Checkbox,
  CheckboxGroup,
} from "@heroui/react";
import { Settings2 } from "lucide-react";

export interface ColumnConfig {
  uid: string;
  name: string;
  isVisible: boolean;
  isMandatory?: boolean;
}

interface ColumnVisibilitySelectorProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  storageKey?: string;
}

export default function ColumnVisibilitySelector({
  columns,
  onColumnsChange,
  storageKey = "leads_column_visibility",
}: ColumnVisibilitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem(storageKey);
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        const updatedColumns = columns.map((col) => {
          const savedCol = parsed.find((p: ColumnConfig) => p.uid === col.uid);
          return savedCol ? { ...col, isVisible: savedCol.isVisible } : col;
        });
        setLocalColumns(updatedColumns);
        onColumnsChange(updatedColumns);
      } catch (error) {
        console.error("Error loading column preferences:", error);
      }
    }
  }, []);

  const handleSelectionChange = (selectedUids: string[]) => {
    const updatedColumns = localColumns.map((col) => ({
      ...col,
      isVisible: col.isMandatory || selectedUids.includes(col.uid),
    }));

    setLocalColumns(updatedColumns);
    onColumnsChange(updatedColumns);

    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(updatedColumns));
  };

  const selectedKeys = localColumns
    .filter((col) => col.isVisible)
    .map((col) => col.uid);

  const visibleCount = localColumns.filter((col) => col.isVisible).length;

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-end">
      <PopoverTrigger>
        <Button
          variant="bordered"
          size="sm"
          startContent={<Settings2 className="h-4 w-4" />}
        >
          Columns ({visibleCount}/{localColumns.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Show Columns</h4>
            <Button
              size="sm"
              variant="light"
              onPress={() => {
                const allSelected = localColumns.map((col) => ({
                  ...col,
                  isVisible: true,
                }));
                setLocalColumns(allSelected);
                onColumnsChange(allSelected);
                localStorage.setItem(storageKey, JSON.stringify(allSelected));
              }}
            >
              Select All
            </Button>
          </div>

          <CheckboxGroup
            value={selectedKeys}
            onValueChange={handleSelectionChange}
            classNames={{
              base: "w-full",
            }}
          >
            {localColumns.map((col) => (
              <Checkbox
                key={col.uid}
                value={col.uid}
                isDisabled={col.isMandatory}
                classNames={{
                  base: "w-full max-w-full",
                  label: "text-sm w-full",
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{col.name}</span>
                  {col.isMandatory && (
                    <span className="text-xs text-gray-400">(Required)</span>
                  )}
                </div>
              </Checkbox>
            ))}
          </CheckboxGroup>

          <div className="pt-2 border-t">
            <Button
              size="sm"
              color="primary"
              fullWidth
              onPress={() => setIsOpen(false)}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
