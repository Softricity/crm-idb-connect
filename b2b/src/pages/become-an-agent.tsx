import { useState } from 'react';
import { Button, Card, CardBody, Input, Textarea, Divider } from '@heroui/react';
import { AgentsAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Globe, 
  MapPin, 
  Clock, 
  BarChart3, 
  MessageSquare, 
  Send,
  CheckCircle2
} from 'lucide-react';

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
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!form.name || !form.email || !form.mobile) {
      setError('Please fill in all required fields (Name, Email, Mobile)');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await AgentsAPI.createInquiry({
        ...form,
        experience_years: form.experience_years ? Number(form.experience_years) : undefined,
      });
      setSubmitted(true);
      setForm({
        name: '', email: '', mobile: '', company_name: '', website: '', country: '', city: '', experience_years: '', student_volume: '', message: '',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-4 mt-2">
      <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
        <Icon size={18} />
      </div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-xl p-10 rounded-3xl shadow-2xl max-w-md w-full text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full text-green-600">
              <CheckCircle2 size={48} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-8">Your inquiry has been submitted successfully. Our team will get back to you shortly.</p>
          <Button 
            color="primary" 
            variant="shadow"
            className="font-bold px-8 py-6 rounded-2xl"
            onPress={() => setSubmitted(false)}
          >
            Submit Another Inquiry
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 py-12 px-4 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-10 text-white">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Partner With Us</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">Join our global network of educational agents and help students achieve their international dreams.</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-md border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardBody className="p-8 md:p-12">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl"
                >
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-10">
              {/* Personal Info Section */}
              <section>
                <SectionTitle icon={User} title="Personal Information" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input 
                    label="Full Name" 
                    placeholder="John Doe" 
                    variant="bordered"
                    labelPlacement="outside"
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    startContent={<User className="text-gray-400" size={18} />}
                  />
                  <Input 
                    label="Email Address" 
                    type="email" 
                    placeholder="john@example.com" 
                    variant="bordered"
                    labelPlacement="outside"
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    startContent={<Mail className="text-gray-400" size={18} />}
                  />
                  <Input 
                    label="Mobile Number" 
                    placeholder="+1 234 567 890" 
                    variant="bordered"
                    labelPlacement="outside"
                    value={form.mobile} 
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })} 
                    startContent={<Phone className="text-gray-400" size={18} />}
                  />
                </div>
              </section>

              <Divider />

              {/* Company Info Section */}
              <section>
                <SectionTitle icon={Building2} title="Agency Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Company Name" 
                    placeholder="Global Ed Services" 
                    variant="bordered"
                    labelPlacement="outside"
                    value={form.company_name} 
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })} 
                    startContent={<Building2 className="text-gray-400" size={18} />}
                  />
                  <Input 
                    label="Website" 
                    placeholder="https://www.example.com" 
                    variant="bordered"
                    labelPlacement="outside"
                    value={form.website} 
                    onChange={(e) => setForm({ ...form, website: e.target.value })} 
                    startContent={<Globe className="text-gray-400" size={18} />}
                  />
                  <Input 
                    label="Country" 
                    placeholder="Your Country" 
                    variant="bordered"
                    labelPlacement="outside"
                    value={form.country} 
                    onChange={(e) => setForm({ ...form, country: e.target.value })} 
                    startContent={<MapPin className="text-gray-400" size={18} />}
                  />
                  <Input 
                    label="City" 
                    placeholder="Your City" 
                    variant="bordered"
                    labelPlacement="outside"
                    value={form.city} 
                    onChange={(e) => setForm({ ...form, city: e.target.value })} 
                    startContent={<MapPin className="text-gray-400" size={18} />}
                  />
                </div>
              </section>

              <Divider />

              {/* Experience Section */}
              <section>
                <SectionTitle icon={BarChart3} title="Experience & Volume" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Years of Experience" 
                    type="number" 
                    placeholder="e.g. 5" 
                    variant="bordered"
                    labelPlacement="outside"
                    value={form.experience_years} 
                    onChange={(e) => setForm({ ...form, experience_years: e.target.value })} 
                    startContent={<Clock className="text-gray-400" size={18} />}
                  />
                  <Input 
                    label="Annual Student Volume" 
                    placeholder="e.g. 50-100 students" 
                    variant="bordered"
                    labelPlacement="outside"
                    value={form.student_volume} 
                    onChange={(e) => setForm({ ...form, student_volume: e.target.value })} 
                    startContent={<BarChart3 className="text-gray-400" size={18} />}
                  />
                </div>
              </section>

              <Divider />

              {/* Message Section */}
              <section>
                <SectionTitle icon={MessageSquare} title="Additional Notes" />
                <Textarea 
                  label="Your Message" 
                  placeholder="Tell us more about your agency and how you'd like to partner with us..." 
                  variant="bordered"
                  labelPlacement="outside"
                  value={form.message} 
                  onChange={(e) => setForm({ ...form, message: e.target.value })} 
                  classNames={{
                    input: "min-h-[120px]"
                  }}
                />
              </section>

              <div className="pt-6">
                <Button 
                  color="primary" 
                  size="lg"
                  variant="shadow"
                  className="w-full py-8 text-lg font-bold rounded-2xl bg-indigo-600 text-white" 
                  isLoading={loading} 
                  onPress={submit}
                  endContent={!loading && <Send size={20} />}
                >
                  {loading ? 'Submitting...' : 'Apply for Partnership'}
                </Button>
                <p className="text-center text-xs text-gray-400 mt-4">
                  By submitting this form, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}

