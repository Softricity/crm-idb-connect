import { Card, CardBody, Chip } from '@heroui/react';
import { GraduationCap } from 'lucide-react';

export interface HomeUniversity {
  id: string;
  name: string;
  city?: string;
  logo?: string;
  is_accessible?: boolean;
  country?: { name?: string };
}

interface UniversityGridProps {
  universities: HomeUniversity[];
}

export default function UniversityGrid({ universities }: UniversityGridProps) {
  if (!universities?.length) {
    return <div className="text-sm text-gray-500">No universities available.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {universities.map((u) => {
        const locked = u.is_accessible === false;
        return (
          <Card key={u.id} className={`hover:scale-[1.01] hover:shadow-md transition-all duration-300 ${locked ? 'opacity-60' : ''}`}>
            <CardBody className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-white flex-shrink-0 flex items-center justify-center border border-gray-200 overflow-hidden shadow-xs">
                    {u.logo ? (
                      <img src={u.logo} alt={`${u.name} logo`} className="w-full h-full object-contain p-1" />
                    ) : (
                      <GraduationCap className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2" title={u.name}>
                      {u.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {u.city || '-'} {u.country?.name ? `• ${u.country.name}` : ''}
                    </div>
                  </div>
                </div>
                <Chip size="sm" color={locked ? 'warning' : 'success'} variant="flat" className="flex-shrink-0">
                  {locked ? 'Locked' : 'Accessible'}
                </Chip>
              </div>
              <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                {locked ? 'Contact admin for access' : 'Visible in your catalog'}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
