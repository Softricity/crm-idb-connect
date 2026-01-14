import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card, CardBody, CardHeader } from '@heroui/react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Router push is handled in the login function
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="flex flex-col gap-1 items-center pt-8 pb-4">
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-sm text-gray-600">Sign in to your B2B account</p>
        </CardHeader>
        <CardBody className="px-8 pb-8">
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
            />
            
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isRequired
                variant="bordered"
                size="lg"
                classNames={{
                  input: "text-base",
                  inputWrapper: "border-gray-300"
                }}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                }
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-semibold text-base"
              startContent={!isLoading && <LogIn className="w-5 h-5" />}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/agents" className="text-blue-600 hover:text-blue-700 font-semibold">
                Register as Agent
              </a>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
