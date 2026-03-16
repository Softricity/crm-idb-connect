"use client";

import { PermissionGuard } from "@/components/PermissionGuard";
import ReportsLanding from "@/components/reports-components/ReportsLanding";
import { AdministrativePermission } from "@/lib/utils";

export default function ReportsLandingPage() {
  return (
    <PermissionGuard requiredPermissions={[AdministrativePermission.REPORTS_VIEW]}>
      <ReportsLanding />
    </PermissionGuard>
  );
}
