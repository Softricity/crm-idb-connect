"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { AgentTable } from '@/components/agent-components/agentTable';
import { PermissionGuard } from '@/components/PermissionGuard';
import { AgentsPermission } from '@/lib/utils';
import { AgentsAPI, UniversitiesAPI } from '@/lib/api';
import { Button, Card, CardBody, Checkbox, Select, SelectItem } from '@heroui/react';

export default function Page() {
  const [agents, setAgents] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedUniIds, setSelectedUniIds] = useState<Set<string>>(new Set());
  const [inquiries, setInquiries] = useState<any[]>([]);

  const load = async () => {
    const [aRes, uRes, iqRes] = await Promise.allSettled([
      AgentsAPI.getAll(),
      UniversitiesAPI.getAll(),
      AgentsAPI.getInquiries(),
    ]);

    setAgents(aRes.status === 'fulfilled' ? (aRes.value || []) : []);
    setUniversities(uRes.status === 'fulfilled' ? (uRes.value || []) : []);
    setInquiries(iqRes.status === 'fulfilled' ? (iqRes.value || []) : []);
  };

  useEffect(() => {
    load();
  }, []);

  const loadAccess = async (agentId: string) => {
    if (!agentId) return;
    const rows = await AgentsAPI.getUniversityAccess(agentId);
    setSelectedUniIds(new Set((rows || []).map((r: any) => r.university_id)));
  };

  const saveAccess = async () => {
    if (!selectedAgent) return;
    await AgentsAPI.setUniversityAccess(selectedAgent, Array.from(selectedUniIds));
    alert('University access updated');
  };

  const updateInquiry = async (id: string, status: string) => {
    await AgentsAPI.updateInquiryStatus(id, status);
    load();
  };

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const u of universities) {
      const key = u.country?.name || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
    }
    return Array.from(map.entries());
  }, [universities]);

  return (
    <PermissionGuard requiredPermissions={[AgentsPermission.AGENTS_CREATE, AgentsPermission.AGENTS_UPDATE]}>
      <div className="space-y-6">
        <AgentTable />

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold">Agent University Access</h2>
            <Select
              label="Agent"
              selectedKeys={selectedAgent ? [selectedAgent] : []}
              onChange={(e) => {
                setSelectedAgent(e.target.value);
                loadAccess(e.target.value);
              }}
            >
              {agents.map((a) => (
                <SelectItem key={a.id}>{a.name}</SelectItem>
              ))}
            </Select>

            <div className="max-h-80 overflow-y-auto border rounded p-3 space-y-3">
              {grouped.map(([country, rows]) => (
                <div key={country}>
                  <div className="font-medium text-sm mb-2">{country}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {rows.map((u) => (
                      <Checkbox
                        key={u.id}
                        isSelected={selectedUniIds.has(u.id)}
                        onValueChange={(checked) => {
                          const next = new Set(selectedUniIds);
                          if (checked) next.add(u.id);
                          else next.delete(u.id);
                          setSelectedUniIds(next);
                        }}
                      >
                        {u.name}
                      </Checkbox>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <Button color="primary" className="text-white" onPress={saveAccess} isDisabled={!selectedAgent}>Save Access</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold">Agent Inquiries</h2>
            <div className="space-y-2">
              {inquiries.map((q) => (
                <div key={q.id} className="border rounded p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{q.name} ({q.email})</div>
                    <div className="text-sm text-gray-500">{q.mobile} • {q.company_name || 'No company'}</div>
                  </div>
                  <Select
                    selectedKeys={[q.status]}
                    onChange={(e) => updateInquiry(q.id, e.target.value)}
                    className="w-48"
                  >
                    {['NEW', 'CONTACTED', 'CONVERTED', 'REJECTED'].map((s) => (
                      <SelectItem key={s}>{s}</SelectItem>
                    ))}
                  </Select>
                </div>
              ))}
              {inquiries.length === 0 ? <div className="text-sm text-gray-500">No inquiries yet.</div> : null}
            </div>
          </CardBody>
        </Card>
      </div>
    </PermissionGuard>
  );
}
