"use client";

import { useEffect, useState } from 'react';
import { ContractsAPI, AgentsAPI } from '@/lib/api';
import { Button, Card, CardBody, Chip, Select, SelectItem } from '@heroui/react';

interface ContractRow {
  id: string;
  title: string;
  status: 'PENDING' | 'SIGNED' | 'APPROVED' | 'REJECTED';
  signature_url?: string;
  rejection_note?: string;
  agent?: { id: string; name: string; email: string };
}

export default function ApprovalsPage() {
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [status, setStatus] = useState('SIGNED');
  const [agentId, setAgentId] = useState('');
  const [agents, setAgents] = useState<any[]>([]);

  const load = async () => {
    const [contracts, agentList] = await Promise.all([
      ContractsAPI.getAll(status || undefined, agentId || undefined),
      AgentsAPI.getAll(),
    ]);
    setRows(contracts || []);
    setAgents(agentList || []);
  };

  useEffect(() => {
    load();
  }, [status, agentId]);

  const approve = async (id: string) => {
    try {
      await ContractsAPI.approve(id);
      load();
    } catch (e: any) {
      alert(e?.body?.message || e?.message || 'Failed to approve contract');
    }
  };

  const reject = async (id: string) => {
    const note = prompt('Rejection note (optional)') || '';
    await ContractsAPI.reject(id, note);
    load();
  };

  const download = async (id: string) => {
    const blob = await ContractsAPI.downloadPdf(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Contract Approvals</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select
          label="Status"
          selectedKeys={[status || '__all__']}
          onChange={(e) => setStatus(e.target.value === '__all__' ? '' : e.target.value)}
          items={[
            { id: '__all__', label: 'All' },
            { id: 'PENDING', label: 'PENDING' },
            { id: 'SIGNED', label: 'SIGNED' },
            { id: 'APPROVED', label: 'APPROVED' },
            { id: 'REJECTED', label: 'REJECTED' },
          ]}
        >
          {(item) => <SelectItem key={item.id} textValue={item.label}>{item.label}</SelectItem>}
        </Select>
        <Select
          label="Agent"
          selectedKeys={[agentId || '__all__']}
          onChange={(e) => setAgentId(e.target.value === '__all__' ? '' : e.target.value)}
          items={[{ id: '__all__', name: 'All Agents' }, ...agents.map((a) => ({ id: a.id, name: a.name }))]}
        >
          {(item) => <SelectItem key={item.id} textValue={item.name}>{item.name}</SelectItem>}
        </Select>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardBody className="space-y-2">
              <div className="flex justify-between items-center gap-2">
                <div>
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-xs text-gray-500">{r.agent?.name} • {r.agent?.email}</div>
                </div>
                <Chip size="sm" color={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warning'}>
                  {r.status}
                </Chip>
              </div>
              <div className="flex gap-2">
                {r.status === 'SIGNED' ? <Button size="sm" color="success" className="text-white" onPress={() => approve(r.id)}>Approve</Button> : null}
                {r.status !== 'REJECTED' ? <Button size="sm" color="danger" variant="flat" onPress={() => reject(r.id)}>Reject</Button> : null}
                <Button size="sm" variant="flat" onPress={() => download(r.id)}>Download PDF</Button>
              </div>
              {r.rejection_note ? <div className="text-sm text-red-600">Reason: {r.rejection_note}</div> : null}
            </CardBody>
          </Card>
        ))}
        {rows.length === 0 ? <div className="text-sm text-gray-500">No contracts found.</div> : null}
      </div>
    </div>
  );
}
