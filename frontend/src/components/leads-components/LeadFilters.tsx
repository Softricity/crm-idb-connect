// components/LeadFiltersDrawer.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Chip,
  DateRangePicker,
  Divider,
} from "@heroui/react";
import {
  Filter as FilterIcon,
  X,
  Search,
  UserRound,
  ListFilter,
  Globe2,
  Tags,
  Calendar as CalendarIcon,
  RefreshCw,
} from "lucide-react";
import { LeadFilterOptions, LeadFilterState } from "@/types/filters";
import {
  fromDate,
  toCalendarDate,
  getLocalTimeZone,
  type DateValue,
} from "@internationalized/date";
import type { RangeValue } from "@react-types/shared";

type Props = {
  value: LeadFilterState;                       // applied filters (from parent)
  onChange: (next: LeadFilterState) => void;   // called only on Apply / Clear
  options: LeadFilterOptions;

  isOpen: boolean;
  onOpenChange: (open: boolean) => void;

  compact?: boolean;
};

const toDateValue = (d: Date | null): DateValue | null =>
  d ? toCalendarDate(fromDate(d, getLocalTimeZone())) : null;

const toRangeValue = (
  dr?: { start?: Date | null; end?: Date | null }
): RangeValue<DateValue> | null => {
  if (!dr || (!dr.start && !dr.end)) return null;
  return {
    start: toDateValue(dr.start ?? null),
    end: toDateValue(dr.end ?? null),
  } as RangeValue<DateValue>;
};

export default function LeadFiltersDrawer({
  value,
  onChange,
  options,
  isOpen,
  onOpenChange,
  compact = false,
}: Props) {
  // ---------- Local staged state (for smooth UX)
  const [draft, setDraft] = useState<LeadFilterState>(value);

  // Sync draft when drawer opens (so re-open reflects latest applied filters)
  useEffect(() => {
    if (isOpen) setDraft(value);
  }, [isOpen, value]);

  // Helpers that update draft only (no parent churn)
  const setDraftField = useCallback(
    <K extends keyof LeadFilterState>(key: K, val: LeadFilterState[K]) =>
      setDraft((prev) => ({ ...prev, [key]: val })),
    []
  );

  const resetDraft = useCallback(() => {
    setDraft({
      search: "",
      types: [],
      owners: [],
      statuses: [],
      sources: [],
      countries: [],
      dateRange: undefined,
    });
  }, []);

  // Apply staged changes
  const apply = useCallback(
    (close: () => void) => {
      onChange(draft);
      close();
    },
    [draft, onChange]
  );

  // Active count (based on draft so user sees live state)
  const activeCount = useMemo(
    () =>
      (draft.search ? 1 : 0) +
      (draft.dateRange?.start || draft.dateRange?.end ? 1 : 0) +
      draft.types.length +
      draft.owners.length +
      draft.statuses.length +
      draft.sources.length +
      draft.countries.length,
    [draft]
  );

  // Memoized selectedKey Sets (avoids Set re-allocations on each render)
  const typesKeys = useMemo(() => new Set(draft.types), [draft.types]);
  const ownersKeys = useMemo(() => new Set(draft.owners), [draft.owners]);
  const statusesKeys = useMemo(() => new Set(draft.statuses), [draft.statuses]);
  const sourcesKeys = useMemo(() => new Set(draft.sources), [draft.sources]);
  const countriesKeys = useMemo(() => new Set(draft.countries), [draft.countries]);

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="right"
      size="lg"
      motionProps={{ initial: { x: 24 }, exit: { x: 24 } }}
      classNames={{
        base: "max-w-[780px] w-full h-full",
        backdrop: "backdrop-blur-sm",
      }}
    >
      <DrawerContent
        className="
          !rounded-l-2xl shadow-2xl border border-default-200
          bg-gradient-to-b from-background to-background
          dark:from-neutral-900 dark:to-neutral-950
        "
      >
        {(onClose) => (
          <>
            {/* Header */}
            <DrawerHeader
              className="
                sticky top-0 z-20 flex items-center justify-between
                px-5 py-4 shadow-sm
              "
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                  <FilterIcon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold tracking-tight">Filters</span>
                  <Chip size="sm" variant="flat" className="bg-white/20 text-white">
                    {activeCount} active
                  </Chip>
                </div>
              </div>
              <Button
                isIconOnly
                variant="light"
                className="text-white hover:bg-white/20"
                onPress={() => onClose()}
                title="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </DrawerHeader>

            {/* Body */}
            <DrawerBody className={`${compact ? "gap-4" : "gap-6"} p-5 sm:p-6`}>
              {/* Quick Search */}
              <Card shadow="sm" className="border border-default-200 bg-background/70 backdrop-blur">
                <CardBody className="gap-3 sm:gap-4">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">Quick Search</h3>
                  <Input
                    label="Search"
                    placeholder="Name, phone, email, source…"
                    value={draft.search}
                    onChange={(e) => setDraftField("search", e.target.value)}
                    startContent={<Search className="h-4 w-4 text-default-500" />}
                    description="Keyword search across name, phone, email, owner, source, status, country."
                  />
                </CardBody>
              </Card>

              {/* Core Filters */}
              <Card shadow="sm" className="border border-default-200 bg-background/70 backdrop-blur">
                <CardBody className="gap-4">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">Core Filters</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Select
                      label="Type"
                      selectionMode="multiple"
                      selectedKeys={typesKeys}
                      onSelectionChange={(keys) =>
                        setDraftField("types", Array.from(keys as Set<string>))
                      }
                      startContent={<Tags className="h-4 w-4 text-default-500" />}
                    >
                      {options.types.map((t) => (
                        <SelectItem key={t} textValue={t}>
                          {t || "-"}
                        </SelectItem>
                      ))}
                    </Select>

                    {options.owners.length > 0 && (
                      <Select
                        label="Owner"
                        selectionMode="multiple"
                        selectedKeys={ownersKeys}
                        onSelectionChange={(keys) =>
                          setDraftField("owners", Array.from(keys as Set<string>))
                        }
                        startContent={<UserRound className="h-4 w-4 text-default-500" />}
                      >
                        {options.owners.map((o) => (
                          <SelectItem key={o} textValue={o}>
                            {o || "Unassigned"}
                          </SelectItem>
                        ))}
                      </Select>
                    )}

                    <Select
                      label="Source"
                      selectionMode="multiple"
                      selectedKeys={sourcesKeys}
                      onSelectionChange={(keys) =>
                        setDraftField("sources", Array.from(keys as Set<string>))
                      }
                      startContent={<Tags className="h-4 w-4 text-default-500" />}
                    >
                      {options.sources.map((s) => (
                        <SelectItem key={s} textValue={s}>
                          {s || "-"}
                        </SelectItem>
                      ))}
                    </Select>

                    <Select
                      label="Preferred Country"
                      selectionMode="multiple"
                      selectedKeys={countriesKeys}
                      onSelectionChange={(keys) =>
                        setDraftField("countries", Array.from(keys as Set<string>))
                      }
                      startContent={<Globe2 className="h-4 w-4 text-default-500" />}
                    >
                      {options.countries.map((c) => (
                        <SelectItem key={c} textValue={c}>
                          {c || "-"}
                        </SelectItem>
                      ))}
                    </Select>

                    <DateRangePicker
                      label="Date Range"
                      value={toRangeValue(draft.dateRange)} // controlled, no key -> smoother
                      onChange={(range) => {
                        if (!range || (!range.start && !range.end)) {
                          setDraftField("dateRange", undefined);
                          return;
                        }
                        setDraftField("dateRange", {
                          start: range.start ? range.start.toDate(getLocalTimeZone()) : null,
                          end: range.end ? range.end.toDate(getLocalTimeZone()) : null,
                        });
                      }}
                      startContent={<CalendarIcon className="h-4 w-4 text-default-500" />}
                      description="Filter by created date."
                    />
                  </div>

                  {/* Active chips row */}
                  <Divider className="my-1" />
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    {draft.search && (
                      <Chip
                        variant="flat"
                        size="sm"
                        onClose={() => setDraftField("search", "")}
                      >
                        search
                      </Chip>
                    )}
                    {draft.types.length > 0 && (
                      <Chip
                        variant="flat"
                        size="sm"
                        onClose={() => setDraftField("types", [])}
                      >
                        type
                      </Chip>
                    )}
                    {draft.owners.length > 0 && (
                      <Chip
                        variant="flat"
                        size="sm"
                        onClose={() => setDraftField("owners", [])}
                      >
                        owner
                      </Chip>
                    )}
                  
                    {draft.sources.length > 0 && (
                      <Chip
                        variant="flat"
                        size="sm"
                        onClose={() => setDraftField("sources", [])}
                      >
                        source
                      </Chip>
                    )}
                    {draft.countries.length > 0 && (
                      <Chip
                        variant="flat"
                        size="sm"
                        onClose={() => setDraftField("countries", [])}
                      >
                        country
                      </Chip>
                    )}
                    {(draft.dateRange?.start || draft.dateRange?.end) && (
                      <Chip
                        variant="flat"
                        size="sm"
                        onClose={() => setDraftField("dateRange", undefined)}
                      >
                        date
                      </Chip>
                    )}
                  </div>
                </CardBody>
              </Card>
            </DrawerBody>

            {/* Footer */}
            <DrawerFooter
              className="
                sticky bottom-0 z-20 bg-background
                border-t border-default-200
                px-5 py-4 flex items-center justify-between
              "
            >
              <div className="hidden sm:flex">
                <Chip variant="flat" color={activeCount > 0 ? "primary" : "default"}>
                  {activeCount} active filter{activeCount === 1 ? "" : "s"}
                </Chip>
              </div>

              <div className="ml-auto flex gap-2">
                <Button
                  variant="flat"
                  startContent={<RefreshCw className="h-4 w-4" />}
                  onPress={resetDraft}
                >
                  Clear all
                </Button>
                <Button variant="light" onPress={() => onClose()}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md hover:shadow-lg"
                  startContent={<FilterIcon className="h-4 w-4" />}
                  onPress={() => apply(onClose)}
                >
                  Apply
                </Button>
              </div>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
