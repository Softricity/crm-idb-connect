import { useState } from 'react';
import { Button, Card, CardBody, Input, Textarea, Divider } from '@heroui/react';
import { AgentsAPI } from '@/lib/api';
import { Outfit } from 'next/font/google';
import {
  User,
  Building2,
  Globe,
  BarChart3,
  MessageSquare,
  Send,
  CheckCircle2,
  FileUp,
  X,
  Plus
} from 'lucide-react';

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={15} className="text-blue-600" />
    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-600">{title}</h3>
  </div>
);

const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 md:p-5">
    {children}
  </div>
);

const fieldClassNames = {
  label: 'text-sm text-gray-700',
  input: 'text-gray-900 placeholder:text-gray-400',
  inputWrapper: 'bg-white border border-gray-300 hover:border-gray-400 group-data-[focus=true]:border-blue-500',
};

export default function BecomeAnAgentPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    company_name: '',
    company_address: '',
    website: '',
    country: '',
    city: '',
    contact_person: '',
    contact_designation: '',
    contact_department: '',
    source_country: '',
    operation_countries: '',
    experience_years: '',
    student_volume: '',
    message: '',
  });
  const [documents, setDocuments] = useState<{ label: string; file_url: string; fileName?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await AgentsAPI.uploadInquiryDocument(file);
      setDocuments([...documents, { label: '', file_url: res.file_url, fileName: file.name }]);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const updateDocumentLabel = (index: number, label: string) => {
    const newDocs = [...documents];
    newDocs[index].label = label;
    setDocuments(newDocs);
  };

  const submit = async () => {
    if (!form.name || !form.email || !form.mobile || !form.company_name || !form.company_address || !form.contact_person || !form.source_country) {
      setError('Please fill in all mandatory fields (Personal, Company Address, Contact Person, Source Country)');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (documents.length > 0 && documents.some(doc => !doc.label)) {
      setError('Please provide labels for all uploaded documents');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await AgentsAPI.createInquiry({
        ...form,
        documents: documents.map(d => ({ label: d.label, file_url: d.file_url })),
        experience_years: form.experience_years ? Number(form.experience_years) : undefined,
      });
      setSubmitted(true);
      setForm({
        name: '', email: '', mobile: '', company_name: '', website: '', country: '', city: '',
        company_address: '', contact_person: '', contact_designation: '', contact_department: '',
        source_country: '', operation_countries: '',
        experience_years: '', student_volume: '', message: '',
      });
      setDocuments([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  if (submitted) {
    return (
      <div className={`${outfit.className} min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-10`}>
        <Card className="w-full max-w-lg border border-gray-200 bg-white shadow-xl">
          <CardBody className="p-8 md:p-10 text-center">
            <div className="flex justify-center mb-5">
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 border border-emerald-200">
                <CheckCircle2 size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-sm text-gray-600 mb-7">
              Your inquiry has been submitted successfully. Our team will get back to you shortly.
            </p>
            <Button
              color="primary"
              className="font-semibold px-6"
              onPress={() => setSubmitted(false)}
            >
              Submit Another Inquiry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${outfit.className} min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 py-10 px-4`}>
      <div className="mx-auto w-full max-w-5xl">
        <div className="text-center mb-8 rounded-xl border border-gray-200 bg-white px-6 py-7 shadow-xl">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Become an Agent</h1>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            Share your agency details to partner with IDB Global.
          </p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden">
          <CardBody className="p-6 md:p-8">
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <SectionCard>
                <SectionTitle icon={User} title="Personal Information" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input label="Full Name" placeholder="John Doe" variant="bordered" labelPlacement="outside" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} classNames={fieldClassNames} />
                  <Input label="Email Address" type="email" placeholder="john@example.com" variant="bordered" labelPlacement="outside" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} classNames={fieldClassNames} />
                  <Input label="Mobile Number" placeholder="+1 234 567 890" variant="bordered" labelPlacement="outside" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} classNames={fieldClassNames} />
                </div>
              </SectionCard>

              <Divider className="bg-gray-200" />

              <SectionCard>
                <SectionTitle icon={Building2} title="Agency Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Company Name" placeholder="Global Ed Services" variant="bordered" labelPlacement="outside" isRequired value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} classNames={fieldClassNames} />
                  <Input label="Website" placeholder="https://www.example.com" variant="bordered" labelPlacement="outside" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} classNames={fieldClassNames} />
                  <Input label="Full Company Address" placeholder="123 Business Way, Suite 100" variant="bordered" labelPlacement="outside" isRequired value={form.company_address} onChange={(e) => setForm({ ...form, company_address: e.target.value })} classNames={fieldClassNames} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Country" placeholder="Your Country" variant="bordered" labelPlacement="outside" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} classNames={fieldClassNames} />
                    <Input label="City" placeholder="Your City" variant="bordered" labelPlacement="outside" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} classNames={fieldClassNames} />
                  </div>
                </div>
              </SectionCard>

              <Divider className="bg-gray-200" />

              <SectionCard>
                <SectionTitle icon={User} title="Contact Person" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input label="Contact Person Name" placeholder="Jane Smith" variant="bordered" labelPlacement="outside" isRequired value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} classNames={fieldClassNames} />
                  <Input label="Designation" placeholder="Director" variant="bordered" labelPlacement="outside" value={form.contact_designation} onChange={(e) => setForm({ ...form, contact_designation: e.target.value })} classNames={fieldClassNames} />
                  <Input label="Department" placeholder="International" variant="bordered" labelPlacement="outside" value={form.contact_department} onChange={(e) => setForm({ ...form, contact_department: e.target.value })} classNames={fieldClassNames} />
                </div>
              </SectionCard>

              <Divider className="bg-gray-200" />

              <SectionCard>
                <SectionTitle icon={Globe} title="Operational Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Source Country (Current location)" placeholder="e.g. India" variant="bordered" labelPlacement="outside" isRequired value={form.source_country} onChange={(e) => setForm({ ...form, source_country: e.target.value })} classNames={fieldClassNames} />
                  <Input label="Operation Countries (Locations you recruit from)" placeholder="e.g. India, Nepal, Sri Lanka" variant="bordered" labelPlacement="outside" value={form.operation_countries} onChange={(e) => setForm({ ...form, operation_countries: e.target.value })} classNames={fieldClassNames} />
                </div>
              </SectionCard>

              <Divider className="bg-gray-200" />

              <SectionCard>
                <SectionTitle icon={BarChart3} title="Experience & Volume" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Years of Experience" type="number" placeholder="e.g. 5" variant="bordered" labelPlacement="outside" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} classNames={fieldClassNames} />
                  <Input label="Annual Student Volume" placeholder="e.g. 50-100 students" variant="bordered" labelPlacement="outside" value={form.student_volume} onChange={(e) => setForm({ ...form, student_volume: e.target.value })} classNames={fieldClassNames} />
                </div>
              </SectionCard>

              <Divider className="bg-gray-200" />

              <SectionCard>
                <SectionTitle icon={FileUp} title="Documents & Accreditation" />
                <p className="text-xs text-gray-500 mb-4 -mt-1">
                  Please upload your business registration, licenses, or any other accreditation certificates. Labels are mandatory for each file.
                </p>

                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 p-3 bg-white rounded-lg border border-gray-200 items-start md:items-end">
                      <div className="flex-1 w-full">
                        <Input label="Document Label" placeholder="e.g. Business License" variant="bordered" size="sm" value={doc.label} onChange={(e) => updateDocumentLabel(index, e.target.value)} isRequired classNames={fieldClassNames} />
                        <p className="text-[11px] text-gray-500 mt-1 truncate">{doc.fileName}</p>
                      </div>
                      <Button isIconOnly color="danger" variant="light" onPress={() => removeDocument(index)}>
                        <X size={18} />
                      </Button>
                    </div>
                  ))}

                  <div className="relative">
                    <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    <label
                      htmlFor="file-upload"
                      className={`flex items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${uploading ? 'bg-gray-100 border-gray-300 opacity-70' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                    >
                      {uploading ? (
                        <span className="text-sm font-medium text-gray-600">Uploading...</span>
                      ) : (
                        <>
                          <Plus size={18} className="text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">Add Document</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </SectionCard>

              <Divider className="bg-gray-200" />

              <SectionCard>
                <SectionTitle icon={MessageSquare} title="Additional Notes" />
                <Textarea
                  label="Your Message"
                  placeholder="Tell us more about your agency and how you'd like to partner with us..."
                  variant="bordered"
                  labelPlacement="outside"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  classNames={{
                    ...fieldClassNames,
                    input: 'min-h-[120px]',
                  }}
                />
              </SectionCard>

              <div className="pt-2">
                <Button
                  color="primary"
                  size="lg"
                  className="w-full font-semibold"
                  isLoading={loading}
                  onPress={submit}
                  endContent={!loading && <Send size={18} />}
                >
                  {loading ? 'Submitting...' : 'Apply for Partnership'}
                </Button>
                <p className="text-center text-xs text-gray-500 mt-3">
                  By submitting this form, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
