"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { hasAnyPermission, hasAllPermissions } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions: string[];
  requireAll?: boolean; // If true, user must have ALL permissions; if false, user must have ANY permission
  fallbackUrl?: string;
  showUnauthorized?: boolean; // If true, show unauthorized message instead of redirecting
}

export function PermissionGuard({
  children,
  requiredPermissions,
  requireAll = false,
  fallbackUrl = "/dashboard",
  showUnauthorized = false,
}: PermissionGuardProps) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);
  const userPermissions = user?.permissions || [];

  const hasAccess = requireAll
    ? hasAllPermissions(userPermissions, requiredPermissions)
    : hasAnyPermission(userPermissions, requiredPermissions);

  useEffect(() => {
    // Wait for auth to load and only check once
    if (loading || hasChecked) {
      return;
    }

    if (!hasAccess && !showUnauthorized) {
      router.replace(fallbackUrl);
    }
    
    setHasChecked(true);
  }, [hasAccess, showUnauthorized, fallbackUrl, router, loading, hasChecked]);

  // Show loading state while auth is initializing
  if (loading) {
    return null;
  }

  if (!hasAccess) {
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to view this content.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

// Component-level permission wrapper (for conditional rendering)
interface ConditionalPermissionProps {
  children: React.ReactNode;
  requiredPermissions: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function ConditionalPermission({
  children,
  requiredPermissions,
  requireAll = false,
  fallback = null,
}: ConditionalPermissionProps) {
  const { user } = useAuthStore();
  const userPermissions = user?.permissions || [];

  const hasAccess = requireAll
    ? hasAllPermissions(userPermissions, requiredPermissions)
    : hasAnyPermission(userPermissions, requiredPermissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
