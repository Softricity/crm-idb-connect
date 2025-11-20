"use client";

import {
  Accordion,
  AccordionItem,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Input,
  Button,
} from '@heroui/react';
import { FilterX, Search } from 'lucide-react';
import { useState } from 'react';

interface FilterSidebarProps {
  filterOptions: {
    countries: string[];
    universities: string[];
    levels: string[];
  };
  selectedFilters: {
    countries: string[];
    universities: string[];
    levels: string[];
    intake: string[];
  };
  onFilterChange: (category: 'countries' | 'universities' | 'levels' | 'intake', value: string, checked: boolean) => void;
  onClearAll: () => void;
  activeFiltersCount: number;
}

const INTAKE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function FilterSidebar({
  filterOptions,
  selectedFilters,
  onFilterChange,
  onClearAll,
  activeFiltersCount,
}: FilterSidebarProps) {
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({
    countries: '',
    universities: '',
    levels: '',
  });

  const filterSections = [
    {
      id: 'countries',
      name: 'Countries',
      options: filterOptions.countries,
      selected: selectedFilters.countries,
    },
    {
      id: 'universities',
      name: 'Universities',
      options: filterOptions.universities,
      selected: selectedFilters.universities,
    },
    {
      id: 'levels',
      name: 'Course Level',
      options: filterOptions.levels,
      selected: selectedFilters.levels,
    },
    {
      id: 'intake',
      name: 'Intake Months',
      options: INTAKE_MONTHS,
      selected: selectedFilters.intake,
    },
  ];

  const getFilteredOptions = (sectionId: string, options: string[]) => {
    const searchTerm = searchTerms[sectionId] || '';
    if (!searchTerm) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <Card className="w-full col-span-2 sticky top-4 max-h-[calc(100vh-120px)]">
      <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
        <h3 className="text-lg font-semibold">Filters</h3>
        {activeFiltersCount > 0 && (
          <Button
            variant="light"
            size="sm"
            startContent={<FilterX className="w-4 h-4" />}
            onPress={onClearAll}
          >
            Clear All
          </Button>
        )}
      </CardHeader>

      <CardBody className="p-2 overflow-y-auto max-h-[calc(100vh-200px)]">
        <Accordion selectionMode="multiple" defaultExpandedKeys={['countries', 'levels']}>
          {filterSections.map((section) => (
            <AccordionItem
              key={section.id}
              aria-label={section.name}
              title={
                <div className="flex items-center justify-between">
                  <span>{section.name}</span>
                  {section.selected.length > 0 && (
                    <span className="text-xs bg-primary text-white rounded-full px-2 py-0.5">
                      {section.selected.length}
                    </span>
                  )}
                </div>
              }
            >
              <div className="px-2 pb-2">
                {/* Search bar for longer lists */}
                {section.options.length > 5 && (
                  <div className="mb-3">
                    <Input
                      placeholder={`Search ${section.name.toLowerCase()}...`}
                      startContent={<Search className="h-4 w-4 text-gray-400" />}
                      size="sm"
                      value={searchTerms[section.id] || ''}
                      onChange={(e) =>
                        setSearchTerms((prev) => ({
                          ...prev,
                          [section.id]: e.target.value,
                        }))
                      }
                      classNames={{
                        input: 'text-sm',
                      }}
                    />
                  </div>
                )}

                {/* Filter options */}
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {getFilteredOptions(section.id, section.options).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">No options found</p>
                  ) : (
                    getFilteredOptions(section.id, section.options).map((option) => (
                      <div key={option} className="flex items-center gap-2">
                        <Checkbox
                          size="sm"
                          isSelected={section.selected.includes(option)}
                          onValueChange={(checked) =>
                            onFilterChange(section.id as 'countries' | 'universities' | 'levels' | 'intake', option, checked)
                          }
                        >
                          <span className="text-sm">{option}</span>
                        </Checkbox>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </CardBody>
    </Card>
  );
}