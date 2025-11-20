"use client"

import Courses from "@/components/courses-components/Courses"
import { PermissionGuard } from "@/components/PermissionGuard";
import { CoursesPermission } from "@/lib/utils";

export default function Page() {
    return (
        <PermissionGuard requiredPermissions={[CoursesPermission.COURSES_VIEW]}>
            <Courses />
        </PermissionGuard>
    )
}