import { AgentTable } from '@/components/agent-components/agentTable'
import { PermissionGuard } from '@/components/PermissionGuard'
import { AgentsPermission } from '@/lib/utils'
import React from 'react'

export default function Page() {
    return (
        <PermissionGuard requiredPermissions={[AgentsPermission.AGENTS_CREATE, AgentsPermission.AGENTS_UPDATE]}>
            <AgentTable />
        </PermissionGuard>
    )
}
