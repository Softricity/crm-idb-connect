import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Spinner } from '@heroui/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, partner } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const enforce = process.env.NEXT_PUBLIC_ENFORCE_CONTRACT_GATE === 'true';
    if (!isLoading && isAuthenticated && enforce) {
      const approved = partner?.contract_approved === true;
      const onContractHub = router.pathname === '/contract-hub';
      if (!approved && !onContractHub) {
        router.push('/contract-hub');
        return;
      }
    }

    if (!isLoading && isAuthenticated && partner?.type === 'agent_team_member') {
      if (router.pathname === '/commission-hub') {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, router, partner]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" label="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
