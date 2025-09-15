"use client"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CalendarDays, Building2, User, X, Check } from "lucide-react"
import { addDays, format, subDays } from "date-fns"
import { useState } from "react"

type FilterBarProps = {
    branches: string[]
    users: string[]
    selectedDateRange: string
    daysCount: number
}

const presets = [
    { label: "Today", range: [new Date(), new Date()] },
    { label: "Yesterday", range: [subDays(new Date(), 1), subDays(new Date(), 1)] },
    { label: "Last 7 Days", range: [subDays(new Date(), 6), new Date()] },
    { label: "Last 30 Days", range: [subDays(new Date(), 29), new Date()] },
    { label: "Last 60 Days", range: [subDays(new Date(), 59), new Date()] },
    { label: "Last 90 Days", range: [subDays(new Date(), 89), new Date()] },
]

export default function FilterBar({
    branches,
    users,
    selectedDateRange,
    daysCount,
}: FilterBarProps) {
    const [date, setDate] = useState<[Date, Date]>([
        subDays(new Date(), 29),
        new Date(),
    ])
    const formattedRange = `${format(date[0], "dd/MM/yyyy")} - ${format(
        date[1],
        "dd/MM/yyyy"
    )}`

    return (
        <div className="flex flex-wrap justify-between items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
            {/* Branch */}
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">Branch</label>
                <Select>
                    <SelectTrigger className="w-[240px] h-11">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select Branch" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {branches.map((branch) => (
                            <SelectItem key={branch} value={branch.toLowerCase()}>
                                {branch}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* User */}
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">User</label>
                <Select>
                    <SelectTrigger className="w-[240px] h-11">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select User" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {users.map((user) => (
                            <SelectItem key={user} value={user.toLowerCase()}>
                                {user}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                    Date Range
                </label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-[280px] h-11 flex items-center justify-start text-left font-normal"
                        >
                            <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground -mb-1">
                                    {Math.ceil(
                                        (date[1].getTime() - date[0].getTime()) / (1000 * 60 * 60 * 24)
                                    ) + 1}{" "}
                                    Days Selected
                                </span>
                                <span className="text-sm font-semibold text-foreground">
                                    {formattedRange}
                                </span>
                            </div>
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent
                        align="start"
                        sideOffset={8}
                        className="flex flex-col md:flex-row gap-4 p-4 w-[100%]  mr-5"
                    >

                        {/* Presets */}
                        <div className="min-w-[140px] flex flex-col gap-1.5 border-r pr-4">
                            {presets.map((preset) => {
                                const isSelected =
                                    formattedRange ===
                                    `${format(preset.range[0], "dd/MM/yyyy")} - ${format(
                                        preset.range[1],
                                        "dd/MM/yyyy"
                                    )}`

                                return (
                                    <Button
                                        key={preset.label}
                                        variant="outline"
                                        className={`justify-start w-full text-sm ${isSelected
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "text-muted-foreground"
                                            }`}
                                        onClick={() => setDate([preset.range[0], preset.range[1]])}
                                    >
                                        {preset.label}
                                    </Button>
                                )
                            })}
                            <Button
                                variant="outline"
                                className="justify-start text-sm text-red-500 mt-2 hover:text-red-600"
                                onClick={() => setDate([subDays(new Date(), 29), new Date()])}
                            >
                                Reset
                            </Button>
                        </div>

                        {/* Calendar */}
                        <div className="flex-1 min-w-[250px] overflow-x-auto">
                            <Calendar
                                mode="range"
                                selected={{ from: date[0], to: date[1] }}
                                onSelect={(range) => {
                                    if (range?.from && range?.to) {
                                        setDate([range.from, range.to])
                                    }
                                }}
                                numberOfMonths={2}
                                defaultMonth={date[1]}
                            />
                        </div>
                    </PopoverContent>

                </Popover>
            </div>


            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-end">
                <Button
                    variant="outline"
                    className="h-11 text-muted-foreground"
                    aria-label="Clear filters"
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                </Button>
                <Button
                    className="h-11 font-semibold px-6 bg-teal-600 text-white hover:bg-teal-900/90"
                    variant="outline"
                    aria-label="Apply filters"
                >
                    <Check className="h-4 w-4 mr-1" />
                    Apply
                </Button>
            </div>
        </div>
    )
}
