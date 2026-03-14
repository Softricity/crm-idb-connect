import { useState } from 'react';
import { Button, Card, CardBody, CardHeader, Input, Textarea } from '@heroui/react';
import { AgentsAPI } from '@/lib/api';

export default function BecomeAnAgentPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    company_name: '',
    website: '',
    country: '',
    city: '',
    experience_years: '',
    student_volume: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.name || !form.email || !form.mobile) {
      alert('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      await AgentsAPI.createInquiry({
        ...form,
        experience_years: form.experience_years ? Number(form.experience_years) : undefined,
      });
      alert('Inquiry submitted successfully');
      setForm({
        name: '', email: '', mobile: '', company_name: '', website: '', country: '', city: '', experience_years: '', student_volume: '', message: '',
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to submit inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <h1 className="text-2xl font-bold">Become an Agent</h1>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            <Input label="Company" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="Experience (years)" type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} />
            <Input label="Student Volume" value={form.student_volume} onChange={(e) => setForm({ ...form, student_volume: e.target.value })} />
          </div>
          <Textarea label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <div className="flex justify-end">
            <Button color="primary" className="text-white" isLoading={loading} onPress={submit}>Submit Inquiry</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
