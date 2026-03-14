import { GetServerSideProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UniversityGrid, { HomeUniversity } from '@/components/home/UniversityGrid';
import { UniversitiesAPI } from '@/lib/api';

interface Props {
  universities: HomeUniversity[];
}

export default function UniversitiesPage({ universities }: Props) {
  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Universities</h1>
        <UniversityGrid universities={universities} />
      </div>
    </ProtectedRoute>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cookies = ctx.req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);

  const token = cookies?.['auth-token'];
  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  try {
    const universities = await UniversitiesAPI.getAllWithAccess(token);
    return { props: { universities: universities || [] } };
  } catch {
    return { props: { universities: [] } };
  }
};
