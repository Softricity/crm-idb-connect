"use client";

import { ReportFilterSection } from "@/types/reports";
import { Button, Checkbox } from "@heroui/react";

type Props = {
  sections: ReportFilterSection[];
  options: Record<string, string[]>;
  selected: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
  onClear: () => void;
};

export default function ReportFiltersPanel({ sections, options, selected, onChange, onClear }: Props) {
  const toggleValue = (key: string, value: string) => {
    const current = selected[key] || [];
    const exists = current.includes(value);
    const nextValues = exists ? current.filter((item) => item !== value) : [...current, value];
    const next = { ...selected, [key]: nextValues };
    if (nextValues.length === 0) {
      delete next[key];
    }
    onChange(next);
  };

  return (
    <aside className="w-full md:w-72 border border-gray-200 rounded-xl p-4 bg-white h-[74vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Filters</h3>
        <Button variant="light" size="sm" onPress={onClear}>Clear All</Button>
      </div>

      <div className="space-y-5">
        {sections.map((section) => {
          const values = Array.from(
            new Set(
              (options[section.key] || [])
                .flatMap((value) => String(value).split(","))
                .map((value) => value.trim())
                .filter(Boolean),
            ),
          );
          if (values.length === 0) {
            return null;
          }

          return (
            <div key={section.key} className="border-t pt-3">
              <h4 className="font-semibold mb-2 text-sm text-gray-700">{section.label}</h4>
              <div className="space-y-2">
                {values.map((value) => (
                  <div key={`${section.key}-${value}`} className="block">
                    <Checkbox
                      isSelected={(selected[section.key] || []).includes(value)}
                      onValueChange={() => toggleValue(section.key, value)}
                      size="sm"
                      className="w-full"
                    >
                      <span className="text-sm block">{value}</span>
                    </Checkbox>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
