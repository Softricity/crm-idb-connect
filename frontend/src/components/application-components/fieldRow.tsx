"use client";

import React from "react";
import {Button, Chip, Tooltip} from "@heroui/react";
import { Pen } from "lucide-react";

type FieldRowProps = {
  label: string;
  value?: string;
  onEdit?: () => void;
  important?: boolean;
};

export default function FieldRow({label, value = "—", onEdit, important}: FieldRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-[180px] text-xs text-foreground-500">{label}</div>
      <div className="flex-1 text-sm font-medium break-words">
        {important ? <Chip size="sm" variant="flat">{value}</Chip> : value}
      </div>
      {onEdit ? (
        <Tooltip content="Edit">
          <Button size="sm" variant="light" onPress={onEdit} aria-label={`Edit ${label}`}>
            <Pen className="h-4 w-4"/>
          </Button>
        </Tooltip>
      ) : (
        <div className="w-[36px]" />
      )}
    </div>
  );
}
