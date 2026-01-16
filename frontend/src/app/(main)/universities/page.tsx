import Universities from '@/components/universities-components/Universities'
import { PermissionGuard } from '@/components/PermissionGuard'
import { UniversityPermission } from '@/lib/utils'
import React from 'react'

export default function page() {
  return (
    <PermissionGuard requiredPermissions={[UniversityPermission.UNIVERSITY_CREATE, UniversityPermission.UNIVERSITY_UPDATE]}>
      <Universities />
    </PermissionGuard>
  )
}
