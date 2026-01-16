"use client";

import { Button, Select, SelectItem, Card, CardBody, Chip, Spinner } from "@heroui/react";
import { Search, GraduationCap, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { CountriesAPI, UniversitiesAPI, CoursesAPI } from "@/lib/api";

interface Country {
    id: string;
    name: string;
    flag?: string;
}

interface University {
    id: string;
    name: string;
    countryId: string;
}

interface FilterOptions {
    countries: string[];
    universities: string[];
    levels: string[];
}

interface Course {
    id: string;
    name: string;
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
            name: string;
            flag?: string;
        };
    };
}

const INTAKE_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

interface CourseSearchingProps {
    initialCountries?: Country[];
    initialFilterOptions?: FilterOptions;
}

export default function CourseSearching({ initialCountries = [], initialFilterOptions }: CourseSearchingProps) {
    const [countries, setCountries] = useState<Country[]>(initialCountries);
    const [universities, setUniversities] = useState<University[]>([]);
    const [filterOptions, setFilterOptions] = useState<FilterOptions>(
        initialFilterOptions || { 
            countries: [], 
            universities: [], 
            levels: []
        }
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedUniversity, setSelectedUniversity] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [selectedIntakes, setSelectedIntakes] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    // Courses state
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        // Only fetch if initial data wasn't provided
        if (initialCountries.length === 0 || !initialFilterOptions) {
            fetchInitialData();
        }
    }, []);

    useEffect(() => {
        if (selectedCountry) {
            fetchUniversities(selectedCountry);
        } else {
            setUniversities([]);
            setSelectedUniversity("");
        }
    }, [selectedCountry]);

    const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            // GET /countries (Public)
            // GET /courses/filters (Public)
            const [countriesData, filtersData] = await Promise.all([
                CountriesAPI.getAll(),
                CoursesAPI.getFilters()
            ]);
            setCountries(countriesData || []);
            setFilterOptions(filtersData || { countries: [], universities: [], levels: [] });
        } catch (error: any) {
            console.error('Error fetching initial data:', error);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUniversities = async (countryId: string) => {
        try {
            // GET /universities?countryId=uuid (Public)
            const data = await UniversitiesAPI.getAll(countryId);
            setUniversities(data || []);
        } catch (error) {
            console.error('Error fetching universities:', error);
            setUniversities([]);
        }
    };

    const applyFilters = () => {
        let filtered = courses;

        // Apply search query filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(
                (course) =>
                    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    course.university?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    course.category?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply country filter
        if (selectedCountry) {
            const country = countries.find(c => c.id === selectedCountry);
            if (country) {
                filtered = filtered.filter(
                    (course) => course.university?.country?.name === country.name
                );
            }
        }

        // Apply university filter
        if (selectedUniversity) {
            const university = universities.find(u => u.id === selectedUniversity);
            if (university) {
                filtered = filtered.filter(
                    (course) => course.university?.name === university.name
                );
            }
        }

        // Apply level filter
        if (selectedLevel) {
            filtered = filtered.filter((course) => course.level === selectedLevel);
        }

        // Apply intake filter
        if (selectedIntakes.size > 0) {
            filtered = filtered.filter((course) =>
                Array.from(selectedIntakes).some(intake => 
                    course.intakeMonth?.includes(intake)
                )
            );
        }

        setFilteredCourses(filtered);
    };

    const handleSearch = async () => {
        setLoading(true);
        setHasSearched(true);

        try {
            // Build search filters according to API_DOC
            const params: any = {};
            
            if (selectedCountry) {
                const country = countries.find(c => c.id === selectedCountry);
                if (country) params.country = country.name;
            }
            
            if (selectedUniversity) {
                const university = universities.find(u => u.id === selectedUniversity);
                if (university) params.university = university.name;
            }
            
            if (selectedLevel) {
                params.level = selectedLevel;
            }
            
            if (selectedIntakes.size > 0) {
                params.intake = Array.from(selectedIntakes).join(',');
            }
            
            if (searchQuery) {
                params.search = searchQuery;
            }

            const data = await CoursesAPI.getAll(params);
            setCourses(data || []);
            setFilteredCourses(data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setError('Failed to load courses. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Apply filters when filter selections change
    useEffect(() => {
        if (hasSearched) {
            applyFilters();
        }
    }, [searchQuery, selectedCountry, selectedUniversity, selectedLevel, selectedIntakes, courses]);

    const clearAllFilters = () => {
        setSearchQuery("");
        setSelectedCountry("");
        setSelectedUniversity("");
        setSelectedLevel("");
        setSelectedIntakes(new Set());
        setFilteredCourses(courses);
    };

    return (
        <div className="w-full space-y-8">
            <div className="bg-radial from-blue-700/80 to-blue-950 rounded-xl p-4 w-full">
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}
                
                <div className="flex items-end justify-between p-3">
                    <h1 className="text-6xl font-semibold text-white mb-4 max-w-md">
                        IDB Connect Course Finder
                    </h1>
                    <img src="/course-finder.png" className="max-h-60 w-50 -mb-8 object-cover" alt="" />
                </div>
                <div className="mt-5">
                    <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                        <Select 
                            label="Select Country"
                            placeholder="Choose a country"
                            selectedKeys={selectedCountry ? [selectedCountry] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                setSelectedCountry(selected);
                            }}
                            isLoading={loading}
                            isDisabled={loading}
                        >
                            {countries.map((country) => (
                                <SelectItem key={country.id}>
                                    {country.name}
                                </SelectItem>
                            ))}
                        </Select>
                        
                        <Select 
                            label="Select Institution"
                            placeholder="Choose a university"
                            selectedKeys={selectedUniversity ? [selectedUniversity] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                setSelectedUniversity(selected);
                            }}
                            isDisabled={!selectedCountry || universities.length === 0}
                        >
                            {universities.map((university) => (
                                <SelectItem key={university.id}>
                                    {university.name}
                                </SelectItem>
                            ))}
                        </Select>
                        
                        <Select 
                            label="Select Level"
                            placeholder="Choose a level"
                            selectedKeys={selectedLevel ? [selectedLevel] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                setSelectedLevel(selected);
                            }}
                            isDisabled={loading}
                        >
                            {filterOptions.levels.map((level) => (
                                <SelectItem key={level}>
                                    {level}
                                </SelectItem>
                            ))}
                        </Select>
                        
                        <Select 
                            label="Select Intake Months"
                            placeholder="Choose intake months"
                            selectionMode="multiple"
                            selectedKeys={selectedIntakes}
                            onSelectionChange={(keys) => {
                                setSelectedIntakes(new Set(Array.from(keys) as string[]));
                            }}
                            isDisabled={loading}
                        >
                            {INTAKE_MONTHS.map((month) => (
                                <SelectItem key={month}>
                                    {month}
                                </SelectItem>
                            ))}
                        </Select>
                        
                        <div className="sm:col-span-1 md:col-span-2 lg:col-span-4 flex items-center">
                            <div className="flex grow items-center bg-white px-3 py-1 rounded-xl focus:ring-1 focus:ring-gray-400 focus:outline-none">
                                <Search className="w-5 h-5 stroke-[1.25px] mr-1" />
                                <input 
                                    type="text" 
                                    className="grow focus:ring-none focus:outline-none border-0 p-2"
                                    placeholder="Search by course name or university..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch();
                                        }
                                    }}
                                    disabled={loading}
                                />
                            </div>
                            <Button 
                                className="ml-2 w-25 h-full bg-black text-white"
                                onPress={handleSearch}
                                isLoading={loading}
                                isDisabled={loading}
                                style={{background: 'linear-gradient(90deg, #bc4e9c, #f80759)'}}
                            >
                                Search
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {hasSearched && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <>
                            {/* Results Header */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-semibold">
                                        Showing {filteredCourses.length} of {courses.length} courses
                                    </p>
                                    {(searchQuery || selectedCountry || selectedUniversity || selectedLevel || selectedIntakes.size > 0) && (
                                        <Button
                                            size="sm"
                                            variant="light"
                                            color="primary"
                                            onPress={clearAllFilters}
                                            className="mt-2"
                                        >
                                            Clear all filters
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Courses Grid */}
                            {filteredCourses.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {filteredCourses.map((course) => (
                                        <div key={course.id} className="bg-radial from-blue-700/80 to-blue-950 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                                                <div className="flex flex-col md:flex-row items-start gap-4 h-full">
                                                    {/* Left Section: Logo and Intakes */}
                                                    <div className="flex md:flex-col items-center gap-3 pr-4 pb-5 md:border-r border-white/20 min-w-37.5">
                                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white flex items-center justify-center">
                                                            {course.university?.logo ? (
                                                                <img
                                                                    src={course.university.logo}
                                                                    alt={`${course.university.name} logo`}
                                                                    className="w-full h-full bg-white object-contain p-1"
                                                                />
                                                            ) : (
                                                                <GraduationCap className="w-8 h-8 text-white" />
                                                            )}
                                                        </div>
                                                        {course.intakeMonth && (
                                                            <div className="text-center">
                                                                <p className="text-sm text-pink-300/90 font-medium">Intakes</p>
                                                                <p className="text-xs font-semibold text-white text-wrap">
                                                                    {course.intakeMonth.split(", ").join(" | ")}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Middle Section: Course Details */}
                                                    <div className="grow space-y-2">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <h3 className="text-lg font-semibold leading-snug line-clamp-2 mb-1 text-white">
                                                                    {course.name} {course.category && `- ${course.category}`}
                                                                </h3>
                                                                <p className="text-sm text-white/80">
                                                                    {course.university?.name}
                                                                    {course.university?.city &&
                                                                        `, ${course.university.city}, ${course.university?.country?.name}`}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            {course.level && (
                                                                <Chip
                                                                    size="sm"
                                                                    variant="flat"
                                                                    className="bg-linear-to-r from-purple-500/80 to-pink-500/80 text-white font-semibold shadow-md"
                                                                    startContent={<GraduationCap className="w-3 h-3" />}
                                                                >
                                                                    {course.level}
                                                                </Chip>
                                                            )}
                                                            {course.duration && (
                                                                <Chip
                                                                    size="sm"
                                                                    variant="flat"
                                                                    className="bg-linear-to-r from-cyan-500/80 to-blue-500/80 text-white font-semibold shadow-md"
                                                                    startContent={<Clock className="w-3 h-3" />}
                                                                >
                                                                    {course.duration} months
                                                                </Chip>
                                                            )}
                                                            {course.applicationFee && (
                                                                <Chip size="sm" variant="flat" className="bg-linear-to-r from-emerald-500/80 to-teal-500/80 text-white font-semibold shadow-md">
                                                                    App Fee: {course.applicationCurrency || "$"}
                                                                    {course.applicationFee}
                                                                </Chip>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Right Section: Fee */}
                                                    {course.fee && (
                                                        <div className="min-w-35 text-right h-full md:pl-4 md:border-l border-pink-400/30">
                                                            <p className="text-xs text-white mb-2 font-medium">Tuition Fee (Per Year)</p>
                                                            <p className="text-lg font-bold flex gap-1 items-center justify-end text-white bg-gradient-to-r from-pink-500/20 to-purple-600/20 px-3 py-1 rounded-lg">
                                                                <span>
                                                                    {course.courseCurrency || "$"}
                                                                </span>
                                                                {course.fee.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <GraduationCap className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        No courses found
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Try adjusting your search criteria or filters
                                    </p>
                                    <Button color="primary" variant="flat" onPress={clearAllFilters}>
                                        Clear all filters
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
