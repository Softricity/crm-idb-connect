import CourseSearching from '@/components/home/CourseSearching';
import { Plus } from 'lucide-react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CountriesAPI, CoursesAPI } from '@/lib/api';

interface Country {
  id: string;
  name: string;
  flag?: string;
}

interface FilterOptions {
  countries: string[];
  universities: string[];
  levels: string[];
}

interface HomeProps {
  countries: Country[];
  filterOptions: FilterOptions;
}

const Home = ({ countries, filterOptions }: HomeProps) => {
  return (
    <ProtectedRoute>
      <CourseSearching initialCountries={countries} initialFilterOptions={filterOptions} /> 
    </ProtectedRoute>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req } = ctx;
  
  // Get auth token from cookies
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);

  const token = cookies?.['auth-token'];

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5005';

  try {
    // Fetch countries and filter options using centralized API
    const [countries, filterOptions] = await Promise.all([
      CountriesAPI.getAll(token),
      CoursesAPI.getFilters(token),
    ]);

    return {
      props: {
        countries: countries || [],
        filterOptions: filterOptions || { countries: [], universities: [], levels: [] },
      },
    };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return {
      props: {
        countries: [],
        filterOptions: { countries: [], universities: [], levels: [] },
      },
    };
  }
}

export default Home