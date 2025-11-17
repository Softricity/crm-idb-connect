"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
} from "@heroui/react";

type FieldDef = {
  label: string;
  path: string[];        // path inside the base object
  kind?: "text" | "textarea" | "select" | "email" | "number" | "tel" | "date";
  options?: { label: string; value: string }[]; // for select
  placeholder?: string;
};

type GroupEditDialogProps = {
  open: boolean;
  title: string;
  baseObject: any;         // object to edit (e.g., data.personal, data.education.tenth, etc.)
  fields: FieldDef[];
  onClose: () => void;
  onSave: (patches: { path: string[]; value: string }[]) => void;
};

function getByPath(obj: any, path: string[]) {
  return path.reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

export default function GroupEditDialog({
  open,
  title,
  baseObject,
  fields,
  onClose,
  onSave,
}: GroupEditDialogProps) {
  // local map keyed by JSON path signature for simplicity
  const initialMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const f of fields) {
      const key = JSON.stringify(f.path);
      const val = getByPath(baseObject, f.path);
      m.set(key, typeof val === "string" ? val : (val ?? ""));
    }
    return m;
  }, [baseObject, fields, open]);

  const [values, setValues] = React.useState<Map<string, string>>(initialMap);
  React.useEffect(() => setValues(initialMap), [initialMap]);

  function setField(path: string[], value: string) {
    const k = JSON.stringify(path);
    const next = new Map(values);
    next.set(k, value);
    setValues(next);
  }

  function renderField(f: FieldDef) {
    const k = JSON.stringify(f.path);
    const v = values.get(k) ?? "";
    const commonProps = {
      label: f.label,
      value: v,
      onValueChange: (nv: string) => setField(f.path, nv),
      placeholder: f.placeholder || "",
    };

    switch (f.kind) {
      case "textarea":
        return <Textarea key={k} {...commonProps} minRows={3} />;
      case "select":
        return (
          <Select
            key={k}
            label={f.label}
            selectedKeys={new Set([v])}
            onSelectionChange={(keys) => {
              const val = Array.from(keys as Set<string>)[0] || "";
              setField(f.path, val);
            }}
          >
            {(f.options || []).map((op) => (
              <SelectItem key={op.value} textValue={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </Select>
        );
      case "email":
        return <Input key={k} type="email" {...commonProps} />;
      case "number":
        return <Input key={k} type="number" {...commonProps} />;
      case "tel":
        return <Input key={k} type="tel" {...commonProps} />;
      case "date":
        return <Input key={k} type="date" {...commonProps} />;
      default:
        return <Input key={k} {...commonProps} />;
    }
  }

  function handleSave() {
    const patches = fields.map((f) => ({
      path: f.path,
      value: values.get(JSON.stringify(f.path)) ?? "",
    }));
    onSave(patches);
  }

  return (
    <Modal isOpen={open} onOpenChange={(v)=>(!v?onClose():null)} scrollBehavior="inside" className="w-[100%]">
      <ModalContent>
        <ModalHeader className="text-base font-semibold">{title}</ModalHeader>
        <ModalBody>
          <div
            className="grid gap-3 grid-cols-2"
          >
            {fields.map(renderField)}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={handleSave}>Save All</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
