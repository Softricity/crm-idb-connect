"use client";

import {
  Card,
  CardBody,
  Button,
  Chip,
  Checkbox,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import {
  Heart,
  MoreVertical,
  GraduationCap,
  Clock,
  DollarSign,
} from 'lucide-react';
import { useState } from 'react';

interface CourseCardProps {
  course: {
    id: string;
    name: string;
    level?: string;
    category?: string;
    duration?: number;
    fee?: number;
    courseCurrency?: string;
    applicationFee?: number;
    applicationCurrency?: string;
    intakeMonth?: string;
    university?: {
      id: string;
      name: string;
      logo?: string;
      city?: string;
      country?: {
        name: string;
        flag?: string;
      };
    };
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardBody className="p-0">
        <div className="flex flex-col md:flex-row items-start gap-4 p-4">
          {/* Left Section: Logo and Intakes */}
          <div className="flex md:flex-col items-center gap-3 pr-4 pb-5 md:border-r min-w-[150px]">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center bg-gray-50">
              {course.university?.logo ? (
                <img
                  src={course.university.logo}
                  alt={`${course.university.name} logo`}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <GraduationCap className="w-8 h-8 text-gray-400" />
              )}
            </div>
            {course.intakeMonth && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Intakes</p>
                <p className="text-xs font-semibold text-primary text-wrap">{course.intakeMonth.split(", ").join(" | ")}</p>
              </div>
            )}
          </div>

          {/* Middle Section: Course Details */}
          <div className="flex-grow space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold leading-snug line-clamp-2 mb-1">
                  {course.name} - {course.category}
                </h3>
                <p className="text-sm text-gray-600">
                  {course.university?.name}
                  {course.university?.city && `, ${course.university.city}, ${course.university?.country?.name}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 absolute bottom-5">
              {course.level && (
                <Chip
                  size="sm"
                  variant="flat"
                  color="danger"
                  startContent={<GraduationCap className="w-3 h-3" />}
                >
                  {course.level}
                </Chip>
              )}
              {course.duration && (
                <Chip
                  size="sm"
                  variant="flat"
                  color="primary"
                  startContent={<Clock className="w-3 h-3" />}
                >
                  {course.duration} months
                </Chip>
              )}
              {course.applicationFee && (
                <Chip size="sm" variant="flat" color="success">
                  App Fee: {course.applicationCurrency || '$'}{course.applicationFee}
                </Chip>
              )}
            </div>
          </div>

          {/* Right Section: Actions and Fee */}
          <div className="flex flex-col justify-between relative min-h-[130px] items-end gap-3 min-w-[140px] md:pl-4 md:border-l">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between gap-2 w-full border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                <span className="text-sm">Select</span>
                <Checkbox
                  isSelected={isSelected}
                  onValueChange={setIsSelected}
                  size="sm"
                />
              </div>
            </div>
            {course.fee && (
              <div className="text-right absolute bottom-0">
                <p className="text-xs text-gray-500">Tuition Fee (Per Year)</p>
                <p className="text-lg font-bold text-primary">
                  {course.courseCurrency || '$'}{course.fee.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
