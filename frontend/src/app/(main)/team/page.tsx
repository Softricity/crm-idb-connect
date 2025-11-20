"use client";

import React from "react";
import { InternalTeamTable } from "@/components/team-components/internalTeamTable";
import { PermissionGuard } from "@/components/PermissionGuard";
import { EmployeePermission } from "@/lib/utils";

export default function InternalTeamPage() {
  return (
    <PermissionGuard requiredPermissions={[EmployeePermission.EMPLOYEE_MANAGE, EmployeePermission.EMPLOYEE_CREATE]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Internal Team</h1>
            <p className="text-muted-foreground">
              Manage your internal team members and their roles
            </p>
          </div>
        </div>
        
        <InternalTeamTable />
      </div>
    </PermissionGuard>
  );
}
