import { useState, FormEvent } from 'react';
import { Button, Input, Card, CardBody, CardHeader } from '@heroui/react';
import { useRouter } from 'next/router';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { AuthAPI } from '@/lib/api';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await AuthAPI.forgotPassword(email);
      setMessage(response?.message || 'If the email exists in our records, a temporary password has been sent.');
      setEmail('');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="flex flex-col gap-2 items-center pt-8 pb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Reset Password</h1>
          <p className="text-sm text-gray-600 text-center px-4">
            Enter your registered email address below and we'll send you a temporary password to regain access.
          </p>
        </CardHeader>
        <CardBody className="px-8 pb-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isRequired
              variant="bordered"
              size="lg"
              classNames={{
                input: "text-base",
                inputWrapper: "border-gray-300"
              }}
              startContent={<Mail className="w-5 h-5 text-gray-400 mr-1" />}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-semibold text-base"
              style={{ background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)' }}
            >
              {isLoading ? 'Submitting...' : 'Send Temporary Password'}
            </Button>
          </form>

          <div className="text-center pt-2">
            <Link 
              href="/login" 
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-semibold gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
