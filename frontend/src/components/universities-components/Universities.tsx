"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button, Input, Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, useDisclosure, Card, CardBody, Spinner, Chip, Checkbox, Select, SelectItem, Textarea } from '@heroui/react';
import useUserPermissions from '@/hooks/usePermissions';
import { hasPermission, UniversityPermission, CoursesPermission } from '@/lib/utils';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';

interface Country {
  id: string;
  name: string;
  flag?: string;
  _count?: { universities: number };
}

interface University {
  id: string;
  name: string;
  logo?: string;
  city?: string;
  countryId: string;
  country?: Country;
  _count?: { courses: number };
}

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
  university?: University;
}

export default function Universities() {
  const userPermissions = useUserPermissions();
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { isOpen: isCountryOpen, onOpen: onCountryOpen, onClose: onCountryClose } = useDisclosure();
  const { isOpen: isUniversityOpen, onOpen: onUniversityOpen, onClose: onUniversityClose } = useDisclosure();
  const { isOpen: isCourseOpen, onOpen: onCourseOpen, onClose: onCourseClose } = useDisclosure();

  const [countryForm, setCountryForm] = useState({ name: '', flag: '' });
  const [universityForm, setUniversityForm] = useState({ name: '', logo: '', city: '' });
  const [courseForm, setCourseForm] = useState({
    name: '', level: '', category: '', duration: 0,
    feeType: 'Per Year', feeCurrency: 'PLN', originalFee: 0,
    courseFee: 0, courseCurrency: 'PLN',
    applicationFee: 0, applicationCurrency: 'PLN',
    intakeMonths: [] as string[],
    commissionType: '%', commissionValue: 0,
    applyToAll: false,
    details: ['', '']
  });
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      // Clear all related state first to avoid stale data
      setUniversities([]);
      setSelectedUniversity(null);
      setCourses([]);
      setSearchQuery('');
      // Then fetch new universities for the selected country
      fetchUniversities(selectedCountry);
    } else {
      // If no country is selected, clear everything
      setUniversities([]);
      setSelectedUniversity(null);
      setCourses([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedUniversity) {
      fetchCourses(selectedUniversity.id);
    } else {
      setCourses([]); // Clear courses when no university is selected
    }
  }, [selectedUniversity]);

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const data = await api.CountriesAPI.getAll();
      setCountries(data);
      if (data.length > 0 && !selectedCountry) {
        setSelectedCountry(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async (countryId: string) => {
    setLoading(true);
    try {
      const data = await api.UniversitiesAPI.getAll(countryId);
      setUniversities(data);
    } catch (error) {
      console.error('Error fetching universities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (universityId: string) => {
    setLoading(true);
    try {
      const data = await api.CoursesAPI.getAll({ universityId });
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCountry = async () => {
    try {
      if (editingCountry) {
        await api.CountriesAPI.update(editingCountry.id, countryForm);
      } else {
        await api.CountriesAPI.create(countryForm);
      }
      setCountryForm({ name: '', flag: '' });
      setEditingCountry(null);
      onCountryClose();
      fetchCountries();
    } catch (error) {
      console.error('Error saving country:', error);
    }
  };

  const handleDeleteCountry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this country?')) return;
    try {
      await api.CountriesAPI.delete(id);
      fetchCountries();
      setSelectedCountry(null);
    } catch (error) {
      console.error('Error deleting country:', error);
    }
  };

  const handleAddUniversity = async () => {
    if (!selectedCountry) return;
    try {
      if (editingUniversity) {
        await api.UniversitiesAPI.update(editingUniversity.id, {
          ...universityForm,
          countryId: selectedCountry,
        });
      } else {
        await api.UniversitiesAPI.create({
          ...universityForm,
          countryId: selectedCountry,
        });
      }
      setUniversityForm({ name: '', logo: '', city: '' });
      setEditingUniversity(null);
      onUniversityClose();
      fetchUniversities(selectedCountry);
    } catch (error) {
      console.error('Error saving university:', error);
    }
  };

  const handleDeleteUniversity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this university?')) return;
    try {
      await api.UniversitiesAPI.delete(id);
      if (selectedCountry) {
        fetchUniversities(selectedCountry);
      }
      setSelectedUniversity(null);
    } catch (error) {
      console.error('Error deleting university:', error);
    }
  };

  const handleAddCourse = async () => {
    if (!selectedUniversity) return;
    try {
      const courseData = {
        name: courseForm.name,
        level: courseForm.level,
        category: courseForm.category,
        duration: courseForm.duration,
        fee_type: courseForm.feeType,
        original_fee: courseForm.originalFee,
        fee_currency: courseForm.feeCurrency,
        fee: courseForm.courseFee,
        course_currency: courseForm.courseCurrency,
        application_fee: courseForm.applicationFee,
        application_currency: courseForm.applicationCurrency,
        intake_month: courseForm.intakeMonths.join(', '),
        commission_type: courseForm.commissionType,
        commission_value: courseForm.commissionValue,
        details: courseForm.details.filter(d => d.trim() !== ''),
      };

      if (editingCourse) {
        await api.CoursesAPI.update(editingCourse.id, courseData);
      } else {
        await api.CoursesAPI.create({
          ...courseData,
          university_id: selectedUniversity.id,
        });
      }

      setCourseForm({
        name: '', level: '', category: '', duration: 0,
        feeType: 'Per Year', feeCurrency: 'PLN', originalFee: 0,
        courseFee: 0, courseCurrency: 'PLN',
        applicationFee: 0, applicationCurrency: 'PLN',
        intakeMonths: [],
        commissionType: '%', commissionValue: 0,
        applyToAll: false,
        details: ['', '']
      });
      setEditingCourse(null);
      onCourseClose();
      fetchCourses(selectedUniversity.id);
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.CoursesAPI.delete(id);
      if (selectedUniversity) {
        fetchCourses(selectedUniversity.id);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const filteredUniversities = universities.filter(uni =>
    uni.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Universities</h1>
      <p className="text-gray-600 text-sm mb-4">
        Manage countries, universities, and courses here.
      </p>

      <div className="w-full flex h-[calc(100vh-120px)]">
        {/* Countries Sidebar */}
        <div className="w-1/5 border-r overflow-y-auto">
          <div className="sticky top-0 z-10 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Countries</h3>
              <Button
                size="sm"
                color="primary"
                variant="light"
                startContent={<Plus className="h-4 w-4" />}
                onPress={onCountryOpen}
              >
                Add
              </Button>
            </div>
          </div>
          
          <div className="p-2">
            {loading && !countries.length ? (
              <div className="flex justify-center p-4">
                <Spinner size="sm" />
              </div>
            ) : (
              countries.map((country) => (
                <div
                  key={country.id}
                  className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition ${
                    selectedCountry === country.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0 flex items-center gap-2" onClick={() => setSelectedCountry(country.id)}>
                    {country.flag && (
                      <span className="text-2xl">{country.flag}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{country.name}</p>
                      <p className="text-xs text-gray-500">
                        {country._count?.universities || 0} universities
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => {
                        setEditingCountry(country);
                        setCountryForm({ name: country.name, flag: country.flag || '' });
                        onCountryOpen();
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDeleteCountry(country.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Universities List */}
        <div className="flex-1 flex flex-col">
          <div className="sticky top-0 z-10 p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Universities</h3>
              {hasPermission(userPermissions, UniversityPermission.UNIVERSITY_CREATE) && (
                <Button
                  size="sm"
                  color="primary"
                  startContent={<Plus className="h-4 w-4" />}
                  onPress={onUniversityOpen}
                  isDisabled={!selectedCountry}
                  className='text-white'
                >
                  Add University
                </Button>
              )}
            </div>
            <Input
              placeholder="Search Universities"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              size="sm"
              classNames={{
                input: "text-sm",
                inputWrapper: "h-9"
              }}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading && !universities.length ? (
              <div className="flex justify-center p-8">
                <Spinner />
              </div>
            ) : filteredUniversities.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No universities found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUniversities.map((uni) => (
                  <Card
                    key={uni.id}
                    className={`${
                      selectedUniversity?.id === uni.id ? 'border-2 border-blue-500' : ''
                    }`}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 cursor-pointer" onClick={() => {
                          if (selectedUniversity?.id === uni.id) {
                            setSelectedUniversity(null);
                          } else {
                            setSelectedUniversity(uni);
                          }
                        }}>
                          {uni.logo && (
                            <img
                              src={uni.logo}
                              alt={uni.name}
                              className="w-12 h-12 object-contain rounded"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                          if (selectedUniversity?.id === uni.id) {
                            setSelectedUniversity(null);
                          } else {
                            setSelectedUniversity(uni);
                          }
                        }}>
                          <h4 className="font-semibold text-sm truncate">{uni.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {uni._count?.courses || 0} courses
                            {uni.city && ` • ${uni.city}`}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {hasPermission(userPermissions, UniversityPermission.UNIVERSITY_UPDATE) && (
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => {
                                setEditingUniversity(uni);
                                setUniversityForm({ name: uni.name, logo: uni.logo || '', city: uni.city || '' });
                                onUniversityOpen();
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission(userPermissions, UniversityPermission.UNIVERSITY_DELETE) ? (
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleDeleteUniversity(uni.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {hasPermission(userPermissions, CoursesPermission.COURSES_CREATE) && (
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              onPress={() => {
                                setSelectedUniversity(uni);
                                onCourseOpen();
                              }}
                            >
                              Add Courses
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Courses Panel */}
        {selectedUniversity && (
          <div className="w-2/5 border-l flex flex-col">
            <div className="sticky top-0 z-10 p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">
                    {selectedUniversity.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {courses.length} courses available
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Spinner />
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No courses added yet
                </div>
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <Card key={course.id} className="shadow-sm">
                      <CardBody className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm mb-2">{course.name}</h5>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {course.level && (
                                <Chip size="sm" variant="flat" color="primary">
                                  {course.level}
                                </Chip>
                              )}
                              {course.category && (
                                <Chip size="sm" variant="flat" color="secondary">
                                  {course.category}
                                </Chip>
                              )}
                            </div>
                            {course.description && (
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {course.description}
                              </p>
                            )}
                            <div className="text-xs text-gray-500 space-y-1">
                              {course.fee && (
                                <div>Fee: {course.courseCurrency} {course.fee}</div>
                              )}
                              {course.intakeMonth && (
                                <div>Intake: {course.intakeMonth.split(", ").join(" | ")}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {hasPermission(userPermissions, CoursesPermission.COURSES_UPDATE) ? (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => {
                                  setEditingCourse(course);
                                  setCourseForm({
                                    name: course.name,
                                    level: course.level || '',
                                    category: course.category || '',
                                    duration: course.duration || 0,
                                    feeType: course.feeType || 'Per Year',
                                    feeCurrency: course.feeCurrency || 'PLN',
                                    originalFee: Number(course.originalFee) || 0,
                                    courseFee: Number(course.fee) || 0,
                                    courseCurrency: course.courseCurrency || 'PLN',
                                    applicationFee: Number(course.applicationFee) || 0,
                                    applicationCurrency: course.applicationCurrency || 'PLN',
                                    intakeMonths: course.intakeMonth ? course.intakeMonth.split(', ') : [],
                                    commissionType: course.commissionType || '%',
                                    commissionValue: Number(course.commissionValue) || 0,
                                    applyToAll: false,
                                    details: Array.isArray(course.details) ? course.details : ['', '']
                                  });
                                  onCourseOpen();
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                            {hasPermission(userPermissions, CoursesPermission.COURSES_DELETE) ? (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => handleDeleteCourse(course.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Country Drawer */}
      <Drawer isOpen={isCountryOpen} onClose={() => {
        onCountryClose();
        setEditingCountry(null);
        setCountryForm({ name: '', flag: '' });
      }} placement="right" size="md">
        <DrawerContent className="p-6">
          <DrawerHeader className="text-xl font-semibold mb-4">
            {editingCountry ? 'Edit Country' : 'Add Country'}
          </DrawerHeader>
          <DrawerBody>
            <div className="space-y-4">
              <Input
                label="Country Name"
                value={countryForm.name}
                onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })}
                isRequired
              />
              <Input
                label="Flag Emoji (Optional)"
                value={countryForm.flag}
                onChange={(e) => setCountryForm({ ...countryForm, flag: e.target.value })}
                placeholder="🇦🇺"
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="light" onPress={() => {
                onCountryClose();
                setEditingCountry(null);
                setCountryForm({ name: '', flag: '' });
              }} className="flex-1">Cancel</Button>
              <Button color="primary" onPress={handleAddCountry} className="flex-1 text-white">
                {editingCountry ? 'Update' : 'Add'}
              </Button>
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Add University Drawer */}
      <Drawer isOpen={isUniversityOpen} onClose={() => {
        onUniversityClose();
        setEditingUniversity(null);
        setUniversityForm({ name: '', logo: '', city: '' });
      }} placement="right" size="md">
        <DrawerContent className="p-6">
          <DrawerHeader className="text-xl font-semibold mb-4">
            {editingUniversity ? 'Edit University' : 'Add University'}
          </DrawerHeader>
          <DrawerBody>
            <div className="space-y-4">
              <Input
                label="University Name"
                value={universityForm.name}
                onChange={(e) => setUniversityForm({ ...universityForm, name: e.target.value })}
                isRequired
              />
              <Input
                label="City (Optional)"
                value={universityForm.city}
                onChange={(e) => setUniversityForm({ ...universityForm, city: e.target.value })}
              />
              <Input
                label="Logo URL (Optional)"
                value={universityForm.logo}
                onChange={(e) => setUniversityForm({ ...universityForm, logo: e.target.value })}
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="light" onPress={() => {
                onUniversityClose();
                setEditingUniversity(null);
                setUniversityForm({ name: '', logo: '', city: '' });
              }} className="flex-1">Cancel</Button>
              <Button color="primary" onPress={handleAddUniversity} className="flex-1 text-white">
                {editingUniversity ? 'Update' : 'Add'}
              </Button>
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Add Course Drawer */}
      <Drawer isOpen={isCourseOpen} onClose={() => {
        onCourseClose();
        setEditingCourse(null);
        setCourseForm({
          name: '', level: '', category: '', duration: 0,
          feeType: 'Per Year', feeCurrency: 'PLN', originalFee: 0,
          courseFee: 0, courseCurrency: 'PLN',
          applicationFee: 0, applicationCurrency: 'PLN',
          intakeMonths: [],
          commissionType: '%', commissionValue: 0,
          applyToAll: false,
          details: ['', '']
        });
      }} placement="right" size="lg">
        <DrawerContent className="overflow-y-auto">
          <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex items-center justify-between">
            <DrawerHeader className="text-xl font-semibold p-0">
              {editingCourse ? 'Edit Course' : 'Add Course'}
            </DrawerHeader>
            <div className="flex gap-2">
              <Button variant="light" onPress={() => {
                onCourseClose();
                setEditingCourse(null);
                setCourseForm({
                  name: '', level: '', category: '', duration: 0,
                  feeType: 'Per Year', feeCurrency: 'PLN', originalFee: 0,
                  courseFee: 0, courseCurrency: 'PLN',
                  applicationFee: 0, applicationCurrency: 'PLN',
                  intakeMonths: [],
                  commissionType: '%', commissionValue: 0,
                  applyToAll: false,
                  details: ['', '']
                });
              }}>Cancel</Button>
              <Button color="primary" onPress={handleAddCourse} className="text-white">{editingCourse ? 'Update' : 'Add'}</Button>
            </div>
          </div>
          <DrawerBody className="px-6 py-6">
            <div className="space-y-6">
              {/* Basic Details Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="University Name"
                    value={selectedUniversity?.name || ''}
                    isReadOnly
                    classNames={{ input: "text-gray-400" }}
                  />
                  <Input
                    label="Course Name"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    isRequired
                  />
                  <Input
                    label="Country"
                    value={selectedUniversity?.country?.name || countries.find(c => c.id === selectedCountry)?.name || ''}
                    isReadOnly
                    classNames={{ input: "text-gray-400" }}
                  />
                  <Input
                    label="City"
                    value={selectedUniversity?.city || ''}
                    isReadOnly
                    classNames={{ input: "text-gray-400" }}
                  />
                  <Input
                    label="Course Level"
                    placeholder="e.g., Masters"
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                  />
                  <Input
                    label="Course Category"
                    placeholder="e.g., IT, Business"
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                  />
                  <Select
                    label="Course Duration (in Months)"
                    placeholder="Select duration"
                    selectedKeys={courseForm.duration ? [courseForm.duration.toString()] : []}
                    onChange={(e) => setCourseForm({ ...courseForm, duration: parseInt(e.target.value) || 0 })}
                  >
                    <SelectItem key="12">12 Months</SelectItem>
                    <SelectItem key="18">18 Months</SelectItem>
                    <SelectItem key="24">24 Months</SelectItem>
                    <SelectItem key="36">36 Months</SelectItem>
                    <SelectItem key="48">48 Months</SelectItem>
                  </Select>
                  <Select
                    label="Course Fee Type"
                    placeholder="Select fee type"
                    selectedKeys={[courseForm.feeType]}
                    onChange={(e) => setCourseForm({ ...courseForm, feeType: e.target.value })}
                  >
                    <SelectItem key="Per Year">Per Year</SelectItem>
                    <SelectItem key="Total">Total</SelectItem>
                    <SelectItem key="Per Semester">Per Semester</SelectItem>
                  </Select>
                  <div className="grid grid-cols-[100px_1fr] col-span-2 gap-2">
                    <Select
                      label=" "
                      selectedKeys={[courseForm.feeCurrency]}
                      onChange={(e) => setCourseForm({ ...courseForm, feeCurrency: e.target.value })}
                      className="min-w-0"
                    >
                      <SelectItem key="PLN">PLN</SelectItem>
                      <SelectItem key="USD">USD</SelectItem>
                      <SelectItem key="EUR">EUR</SelectItem>
                      <SelectItem key="GBP">GBP</SelectItem>
                    </Select>
                    <Input
                      label="Course Original Fee"
                      type="number"
                      value={courseForm.originalFee.toString()}
                      onChange={(e) => setCourseForm({ ...courseForm, originalFee: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  {/* Course Fee */}
                  <div className="grid grid-cols-[100px_1fr] col-span-2 gap-2">
                    <Select
                      label=" "
                      selectedKeys={[courseForm.courseCurrency]}
                      onChange={(e) => setCourseForm({ ...courseForm, courseCurrency: e.target.value })}
                      className="min-w-0"
                    >
                      <SelectItem key="PLN">PLN</SelectItem>
                      <SelectItem key="USD">USD</SelectItem>
                      <SelectItem key="EUR">EUR</SelectItem>
                      <SelectItem key="GBP">GBP</SelectItem>
                    </Select>
                    <Input
                      label="Course Fee"
                      type="number"
                      value={courseForm.courseFee.toString()}
                      onChange={(e) => setCourseForm({ ...courseForm, courseFee: parseFloat(e.target.value) || 0 })}
                    />  
                  </div>
                  <div className="grid grid-cols-[100px_1fr] col-span-2 gap-2">
                    <Select
                      label=" "
                      selectedKeys={[courseForm.applicationCurrency]}
                      onChange={(e) => setCourseForm({ ...courseForm, applicationCurrency: e.target.value })}
                      className="min-w-0"
                    >
                      <SelectItem key="PLN">PLN</SelectItem>
                      <SelectItem key="USD">USD</SelectItem>
                      <SelectItem key="EUR">EUR</SelectItem>
                      <SelectItem key="GBP">GBP</SelectItem>
                    </Select>
                    <Input
                      label="Application Fee"
                      type="number"
                      value={courseForm.applicationFee.toString()}
                      onChange={(e) => setCourseForm({ ...courseForm, applicationFee: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Intake Months Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Intake Months</h3>
                <div className="flex flex-wrap gap-3 text-sm">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                    <Checkbox
                      key={month}
                      isSelected={courseForm.intakeMonths.includes(month)}
                      onValueChange={(checked) => {
                        if (checked) {
                          setCourseForm({ ...courseForm, intakeMonths: [...courseForm.intakeMonths, month] });
                        } else {
                          setCourseForm({ ...courseForm, intakeMonths: courseForm.intakeMonths.filter(m => m !== month) });
                        }
                      }}
                    >
                      {month}
                    </Checkbox>
                  ))}
                </div>
              </div>

              {/* Commission Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Commission (University)</h3>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <Select
                    selectedKeys={[courseForm.commissionType]}
                    onChange={(e) => setCourseForm({ ...courseForm, commissionType: e.target.value })}
                    className="min-w-0"
                  >
                    <SelectItem key="%">%</SelectItem>
                    <SelectItem key="USD">USD</SelectItem>
                    <SelectItem key="EUR">EUR</SelectItem>
                    <SelectItem key="PLN">PLN</SelectItem>
                  </Select>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={courseForm.commissionValue.toString()}
                    onChange={(e) => setCourseForm({ ...courseForm, commissionValue: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Checkbox
                  className="mt-3"
                  isSelected={courseForm.applyToAll}
                  onValueChange={(checked) => setCourseForm({ ...courseForm, applyToAll: checked })}
                >
                  Apply this commission to All Courses of this University
                </Checkbox>
              </div>

              {/* Details Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Details</h3>
                <div className="space-y-3">
                  {courseForm.details.map((detail, index) => (
                    <Input
                      key={index}
                      placeholder={`Point ${index + 1}`}
                      value={detail}
                      onChange={(e) => {
                        const newDetails = [...courseForm.details];
                        newDetails[index] = e.target.value;
                        setCourseForm({ ...courseForm, details: newDetails });
                      }}
                    />
                  ))}
                  <Button
                    variant="light"
                    size="sm"
                    onPress={() => setCourseForm({ ...courseForm, details: [...courseForm.details, ''] })}
                  >
                    + Add Point
                  </Button>
                </div>
              </div>
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
