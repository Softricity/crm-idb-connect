"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Input, Spinner, Button, Chip } from '@heroui/react';
import { Search } from 'lucide-react';
import CourseCard from './courseCards';
import FilterSidebar from './filterSidebar';

interface Course {
  id: string;
  name: string;
  description?: string;
  level?: string;
  category?: string;
  duration?: number;
  feeType?: string;
  originalFee?: number;
  feeCurrency?: string;
  fee?: number;
  courseCurrency?: string;
  applicationFee?: number;
  applicationCurrency?: string;
  intakeMonth?: string;
  commissionType?: string;
  commissionValue?: number;
  details?: string[];
  universityId: string;
  university?: {
    id: string;
    name: string;
    logo?: string;
    city?: string;
    country?: {
      id: string;
      name: string;
      flag?: string;
    };
  };
}

interface FilterOptions {
  countries: string[];
  universities: string[];
  levels: string[];
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    countries: [],
    universities: [],
    levels: [],
  });
  const [selectedFilters, setSelectedFilters] = useState({
    countries: [] as string[],
    universities: [] as string[],
    levels: [] as string[],
    intake: [] as string[],
  });

  useEffect(() => {
    fetchCourses();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courses, searchQuery, selectedFilters]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await api.CoursesAPI.getAll();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const data = await api.CoursesAPI.getFilters();
      setFilterOptions(data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.university?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Country filter
    if (selectedFilters.countries.length > 0) {
      filtered = filtered.filter((course) =>
        selectedFilters.countries.includes(course.university?.country?.name || '')
      );
    }

    // University filter
    if (selectedFilters.universities.length > 0) {
      filtered = filtered.filter((course) =>
        selectedFilters.universities.includes(course.university?.name || '')
      );
    }

    // Level filter
    if (selectedFilters.levels.length > 0) {
      filtered = filtered.filter((course) =>
        selectedFilters.levels.includes(course.level || '')
      );
    }

    // Intake filter
    if (selectedFilters.intake.length > 0) {
      filtered = filtered.filter((course) =>
        selectedFilters.intake.some((month) =>
          course.intakeMonth?.includes(month)
        )
      );
    }

    setFilteredCourses(filtered);
  };

  const handleFilterChange = (category: keyof typeof selectedFilters, value: string, checked: boolean) => {
    setSelectedFilters((prev) => {
      const updated = { ...prev };
      if (checked) {
        updated[category] = [...updated[category], value];
      } else {
        updated[category] = updated[category].filter((item) => item !== value);
      }
      return updated;
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      countries: [],
      universities: [],
      levels: [],
      intake: [],
    });
    setSearchQuery('');
  };

  const activeFiltersCount = 
    selectedFilters.countries.length +
    selectedFilters.universities.length +
    selectedFilters.levels.length +
    selectedFilters.intake.length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Courses</h1>
        <p className="text-gray-600 text-sm">
          Browse and filter through our course offerings
        </p>
      </div>

      <div className="grid grid-cols-8 gap-6">
        {/* Filter Sidebar */}
        <FilterSidebar
          filterOptions={filterOptions}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onClearAll={clearAllFilters}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Main Content */}
        <div className="col-span-6">
          {/* Search and Results Count */}
          <div className="mb-4 space-y-3">
            <Input
              placeholder="Search courses or universities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              size="lg"
              classNames={{
                input: "text-sm",
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {loading ? (
                  'Loading courses...'
                ) : (
                  <>
                    Showing <span className="font-semibold">{filteredCourses.length}</span> of{' '}
                    <span className="font-semibold">{courses.length}</span> courses
                  </>
                )}
              </p>
              {activeFiltersCount > 0 && (
                <Chip size="sm" color="primary" variant="flat">
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                </Chip>
              )}
            </div>
          </div>

          {/* Course List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-2">No courses found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters or search query</p>
              {activeFiltersCount > 0 && (
                <Button
                  color="primary"
                  variant="light"
                  onPress={clearAllFilters}
                  className="mt-4"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
