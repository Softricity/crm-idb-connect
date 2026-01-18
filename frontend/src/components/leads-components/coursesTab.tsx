"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Input, Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, Select, SelectItem } from '@heroui/react';
import { Search, Plus, Trash2 } from 'lucide-react';
import CourseCard from '@/components/courses-components/courseCards';

interface Course {
  id: string;
  name: string;
  description?: string;
  level?: string;
  category?: string;
  duration?: number;
  fee?: number;
  courseCurrency?: string;
  applicationFee?: number;
  applicationCurrency?: string;
  intakeMonth?: string;
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

interface Country {
  id: string;
  name: string;
  flag?: string;
}

interface University {
  id: string;
  name: string;
  logo?: string;
  city?: string;
  countryId: string;
}

export default function CoursesTab({ leadId }: { leadId: string }) {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processingCourseId, setProcessingCourseId] = useState<string | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [countriesData, coursesData, leadData] = await Promise.all([
          api.CountriesAPI.getAll(),
          api.CoursesAPI.getAll(),
          api.LeadsAPI.fetchLeadById(leadId),
        ]);
        setCountries(countriesData || []);
        setAllCourses(coursesData || []);
        // Set the courses already associated with this lead
        if (leadData?.courses && Array.isArray(leadData.courses)) {
          setSelectedCourses(leadData.courses);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [leadId]);

  // Fetch universities when country changes
  useEffect(() => {
    if (selectedCountry) {
      const fetchUniversities = async () => {
        try {
          const data = await api.UniversitiesAPI.getAll(selectedCountry);
          setUniversities(data || []);
          setSelectedUniversity('');
        } catch (error) {
          console.error('Error fetching universities:', error);
        }
      };
      fetchUniversities();
    }
  }, [selectedCountry]);

  // Filter courses based on selection and search
  const filteredCourses = allCourses.filter((course) => {
    const matchesCountry = !selectedCountry || course.university?.country?.id === selectedCountry;
    const matchesUniversity = !selectedUniversity || course.university?.id === selectedUniversity;
    const matchesSearch = !searchQuery || 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.university?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCountry && matchesUniversity && matchesSearch;
  });

  const handleAddCourse = async (course: Course) => {
    if (selectedCourses.find(c => c.id === course.id)) {
      return; // Already added
    }
    try {
      setProcessingCourseId(course.id);
      await api.LeadsAPI.addCourseToLead(leadId, course.id);
      setSelectedCourses([...selectedCourses, course]);
    } catch (error) {
      console.error('Error adding course:', error);
    } finally {
      setProcessingCourseId(null);
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    try {
      setProcessingCourseId(courseId);
      await api.LeadsAPI.removeCourseFromLead(leadId, courseId);
      setSelectedCourses(selectedCourses.filter(c => c.id !== courseId));
    } catch (error) {
      console.error('Error removing course:', error);
    } finally {
      setProcessingCourseId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Selected Courses */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Selected Courses</h3>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => setIsDialogOpen(true)}
          >
            Add Course
          </Button>
        </div>
        {selectedCourses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No courses selected yet.</p>
        ) : (
          <div className="space-y-4">
            {selectedCourses.map((course) => (
              <div key={course.id} className="relative">
                <CourseCard course={course} />
                <div className="absolute top-4 right-4">
                  <Button
                    isIconOnly
                    color="danger"
                    variant="flat"
                    size="sm"
                    onPress={() => handleRemoveCourse(course.id)}
                    isLoading={processingCourseId === course.id}
                    isDisabled={processingCourseId === course.id}
                  >
                    {processingCourseId === course.id ? (
                      <Spinner size="sm" color="danger" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Courses Modal */}
      <Modal 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Add Courses to Lead</ModalHeader>
          <ModalBody>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Select
                label="Select Country"
                placeholder="Choose a country"
                selectedKeys={selectedCountry ? [selectedCountry] : []}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                {countries.map((country) => (
                  <SelectItem key={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Select University"
                placeholder="Choose a university"
                selectedKeys={selectedUniversity ? [selectedUniversity] : []}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                isDisabled={!selectedCountry}
              >
                {universities.map((university) => (
                  <SelectItem key={university.id}>
                    {university.name}
                  </SelectItem>
                ))}
              </Select>

              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="h-4 w-4 text-gray-400" />}
                size="lg"
                classNames={{
                  input: "text-sm",
                }}
              />
            </div>

            {/* Course List */}
            <div className="space-y-4">
              {filteredCourses.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No courses found. Try adjusting your filters.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Found {filteredCourses.length} course(s)</p>
                  {filteredCourses.map((course) => {
                    const isSelected = selectedCourses.find(c => c.id === course.id);
                    return (
                      <div key={course.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{course.name}</h4>
                          <p className="text-sm text-gray-600">{course.university?.name}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {course.level && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">{course.level}</span>
                            )}
                            {course.duration && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{course.duration} months</span>
                            )}
                            {course.fee && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{course.courseCurrency || '$'}{course.fee}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          isIconOnly
                          color={isSelected ? "danger" : "success"}
                          variant="flat"
                          size="sm"
                          onPress={() => isSelected ? handleRemoveCourse(course.id) : handleAddCourse(course)}
                          isLoading={processingCourseId === course.id}
                          isDisabled={processingCourseId === course.id}
                          className="ml-4 flex-shrink-0"
                        >
                          {processingCourseId === course.id ? (
                            <Spinner size="sm" />
                          ) : isSelected ? (
                            <Trash2 className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
