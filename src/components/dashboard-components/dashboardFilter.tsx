"use client"

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Building2,
    User,
    CalendarDays,
    X,
    Check,
} from "lucide-react"

type FilterBarProps = {
    branches: string[]
    users: string[]
    selectedDateRange: string
    daysCount: number
}

export default function FilterBar({
    branches,
    users,
    selectedDateRange,
    daysCount,
}: FilterBarProps) {
    return (
        <div className="flex flex-wrap justify-between items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                    Branch
                </label>
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

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                    User
                </label>
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
                <Button
                    variant="outline"
                    className="w-[280px] h-11 flex items-center justify-start text-left font-normal"
                >
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground -mb-1">
                            {daysCount} Days Selected
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                            {selectedDateRange}
                        </span>
                    </div>
                </Button>
            </div>

            <div className="flex items-center gap-2 self-end">
                <Button
                    variant="outline"
                    className="h-11 text-muted-foreground"
                    aria-label="Clear filters"
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                </Button>

                <Button className="h-11 font-semibold px-6 bg-teal-600 text-white hover:bg-teal-900/90 hover:text-white"
                    variant="outline"
                    aria-label="Apply filters">
                    <Check className="h-4 w-4 mr-1" />
                    Apply
                </Button>
            </div>
        </div>
    )
}