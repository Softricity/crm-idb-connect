"use client";

import { PermissionGuard } from "@/components/PermissionGuard";
import ReportPageView from "@/components/reports-components/ReportPageView";
import { AdministrativePermission } from "@/lib/utils";
import { REPORT_TYPES, ReportType } from "@/types/reports";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ReportTypePage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const type = params?.type as ReportType;

  useEffect(() => {
    if (!REPORT_TYPES.includes(type)) {
      router.replace("/reports");
    }
  }, [router, type]);

  if (!REPORT_TYPES.includes(type)) return null;

  return (
    <PermissionGuard requiredPermissions={[AdministrativePermission.REPORTS_VIEW]}>
      <ReportPageView type={type} />
    </PermissionGuard>
  );
}
