import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AgentsAPI } from '@/lib/api';
import { Button, Card, CardBody, Input, Switch } from '@heroui/react';
import { useEffect, useState } from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  mobile: string;
  is_active: boolean;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await AgentsAPI.getMyTeam();
      setMembers(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createMember = async () => {
    if (!form.name || !form.email || !form.mobile || !form.password) {
      alert('Please fill all fields');
      return;
    }
    await AgentsAPI.createTeamMember(form);
    setForm({ name: '', email: '', mobile: '', password: '' });
    load();
  };

  const toggleActive = async (m: TeamMember) => {
    await AgentsAPI.updateTeamMember(m.id, { is_active: !m.is_active });
    load();
  };

  const removeMember = async (id: string) => {
    if (!confirm('Delete team member?')) return;
    await AgentsAPI.deleteTeamMember(id);
    load();
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Team Management</h1>

        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-semibold">Add Team Member</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <Button color="primary" className="text-white" onPress={createMember}>Create Member</Button>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-3">
          {loading ? <div>Loading...</div> : members.map((m) => (
            <Card key={m.id}>
              <CardBody className="flex flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-sm text-gray-500">{m.email} • {m.mobile}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch isSelected={m.is_active} onValueChange={() => toggleActive(m)}>
                    Active
                  </Switch>
                  <Button color="danger" variant="light" onPress={() => removeMember(m.id)}>Delete</Button>
                </div>
              </CardBody>
            </Card>
          ))}
          {!loading && members.length === 0 ? <div className="text-sm text-gray-500">No team members yet.</div> : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}
