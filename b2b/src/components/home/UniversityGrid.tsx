import { Card, CardBody, Chip } from '@heroui/react';

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
          <Card key={u.id} className={locked ? 'opacity-50' : ''}>
            <CardBody className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.city || '-'} {u.country?.name ? `• ${u.country.name}` : ''}</div>
                </div>
                <Chip size="sm" color={locked ? 'warning' : 'success'} variant="flat">
                  {locked ? 'Locked' : 'Accessible'}
                </Chip>
              </div>
              <div className="text-xs text-gray-500">
                {locked ? 'Contact admin for access' : 'Visible in your catalog'}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
