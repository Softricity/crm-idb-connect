"use client";

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Heart,
    MoreVertical,
    GraduationCap,
    Clock,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
    course: {
        id: number;
        title: string;
        university: string;
        duration: string;
        fee: string;
        intake: string;
        level: string;
        appFee: string;
        logoUrl?: string;
    };
};

export default function CourseCard({ course }: Props) {
    return (
        <Card className="flex flex-col md:flex-row p-4 items-start gap-4 border shadow-sm transition-all duration-300 hover:shadow-md">
            {/* Left Section: Logo and Intakes */}
            <div className="flex md:flex-col items-center gap-3 pr-4 border-r min-w-[100px]">
                <div className="w-16 h-16 rounded-full overflow-hidden border flex items-center justify-center bg-gray-50">
                    {course.logoUrl ? (
                        <img
                            src={course.logoUrl}
                            alt={`${course.university} logo`}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <GraduationCap className="w-8 h-8 text-muted-foreground" />
                    )}
                </div>
                <div className="text-center md:text-left">
                    <p className="text-xs text-muted-foreground">Intakes</p>
                    <p className="text-sm font-semibold text-primary">{course.intake}</p>
                </div>
            </div>

            {/* Middle Section: Course Details */}
            <div className="flex-grow space-y-2">
                <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold leading-snug line-clamp-2">
                        {course.title}
                    </h3>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 flex-shrink-0"
                            >
                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-32 p-2 rounded-md shadow border bg-popover text-popover-foreground"
                            align="end"
                            side="bottom"
                        >
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-sm"
                                    onClick={() => console.log("Edit course", course.id)}
                                >
                                    ✏️ Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-sm text-red-600 hover:text-red-700"
                                    onClick={() => console.log("Delete course", course.id)}
                                >
                                    🗑️ Delete
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                </div>
                <p className="text-sm text-muted-foreground">{course.university}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="flex items-center gap-1 bg-red-50 text-red-600 border-red-200">
                        <GraduationCap className="w-3 h-3" /> {course.level}
                    </Badge>
                    <Badge className="flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200">
                        <Clock className="w-3 h-3" /> {course.duration}
                    </Badge>
                    <Badge className="bg-green-50 text-green-600 border-green-200">
                        App Fee: {course.appFee}
                    </Badge>
                </div>
            </div>

            {/* Right Section: Actions and Fee */}
            <div className="flex flex-col justify-between items-end gap-3 min-w-[140px] pl-4 border-l">
                <div className="flex flex-col gap-2 w-full">
                    <Button variant="outline" size="sm" className="justify-center w-full">
                        Save <Heart className="w-4 h-4 ml-1" />
                    </Button>
                    <div className="flex items-center justify-center gap-2 w-full border rounded px-3 py-1.5 hover:bg-muted/20 transition-colors shadow">
                        <span className="text-sm">Select</span>
                        <Checkbox
                            id={`select-course-${course.id}`}
                            className="data-[state=checked]:bg-primary shadow-sm border"
                        />
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Tuition Fee (Per Year)</p>
                    <p className="text-base font-bold text-primary">{course.fee}</p>
                </div>
            </div>
        </Card>
    );
}
