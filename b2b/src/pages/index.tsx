import CourseSearching from '@/components/home/CourseSearching';
import UniversityGrid, { HomeUniversity } from '@/components/home/UniversityGrid';
import { GetServerSideProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CountriesAPI, CoursesAPI, UniversitiesAPI } from '@/lib/api';

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
  universities: HomeUniversity[];
}

const Home = ({ countries, filterOptions, universities }: HomeProps) => {
  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <CourseSearching initialCountries={countries} initialFilterOptions={filterOptions} />
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Universities</h2>
          <UniversityGrid universities={universities} />
        </div>
      </div>
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

  try {
    const [countries, filterOptions, universities] = await Promise.all([
      CountriesAPI.getAll(token),
      CoursesAPI.getFilters(token),
      UniversitiesAPI.getAllWithAccess(token),
    ]);

    return {
      props: {
        countries: countries || [],
        filterOptions: filterOptions || { countries: [], universities: [], levels: [] },
        universities: universities || [],
      },
    };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return {
      props: {
        countries: [],
        filterOptions: { countries: [], universities: [], levels: [] },
        universities: [],
      },
    };
  }
}

export default Home
