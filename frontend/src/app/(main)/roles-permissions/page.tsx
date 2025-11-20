"use client"

import { PermissionGuard } from '@/components/PermissionGuard'
import RolesPermissions from '@/components/roles-permissions-components/RolesPermissions'
import { PermissionPermission } from '@/lib/utils'
import React from 'react'

export default function page() {
  return (
    <PermissionGuard requiredPermissions={[PermissionPermission.ROLES_CREATE, PermissionPermission.ROLES_PERMISSION]}>
        <RolesPermissions />
    </PermissionGuard>
  )
}
