"use client";

import React from 'react';
import { AgentTable } from '@/components/agent-components/agentTable';
import { PermissionGuard } from '@/components/PermissionGuard';
import { AgentsPermission } from '@/lib/utils';

export default function Page() {
  return (
    <PermissionGuard requiredPermissions={[AgentsPermission.AGENTS_CREATE, AgentsPermission.AGENTS_UPDATE]}>
      <div className="space-y-6">
        <AgentTable />
      </div>
    </PermissionGuard>
  );
}
