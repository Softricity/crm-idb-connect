"use client";

import Referral from '@/components/referral-components/Referral'
import { PermissionGuard } from '@/components/PermissionGuard';
import { AgencyPermission } from '@/lib/utils';
import React from 'react'

export default function AdminReferralsPage() {
  return (
    // <PermissionGuard requiredPermissions={[]}>
      <Referral />
    // </PermissionGuard>
  );
}
