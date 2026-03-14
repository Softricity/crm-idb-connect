"use client";

import { useEffect, useState } from 'react';
import { AgentsAPI, ContractsAPI } from '@/lib/api';
import { Button, Card, CardBody, Input, Select, SelectItem, Textarea } from '@heroui/react';

interface Agent {
  id: string;
  name: string;
  email: string;
}

export default function AgreementsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [form, setForm] = useState({ agent_id: '', title: '', content: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = await AgentsAPI.getAll('APPROVED');
    setAgents(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const createContract = async () => {
    if (!form.agent_id || !form.title || !form.content) {
      alert('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await ContractsAPI.create(form);
      alert('Contract created');
      setForm({ agent_id: '', title: '', content: '' });
    } catch (e: any) {
      alert(e?.message || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Agent Agreements</h1>
      <Card>
        <CardBody className="space-y-4">
          <Select
            label="Agent"
            selectedKeys={form.agent_id ? [form.agent_id] : []}
            onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
          >
            {agents.map((a) => (
              <SelectItem key={a.id}>{a.name} ({a.email})</SelectItem>
            ))}
          </Select>
          <Input label="Contract Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Contract Content (HTML allowed)" minRows={12} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <div className="flex justify-end">
            <Button color="primary" className="text-white" isLoading={loading} onPress={createContract}>Create Agreement</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
