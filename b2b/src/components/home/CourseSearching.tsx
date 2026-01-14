"use client";

import { Button, Select, SelectItem } from "@heroui/react";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { CountriesAPI, UniversitiesAPI, CoursesAPI } from "@/lib/api";
import { useRouter } from "next/router";

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

const INTAKE_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

interface CourseSearchingProps {
    initialCountries?: Country[];
    initialFilterOptions?: FilterOptions;
}

export default function CourseSearching({ initialCountries = [], initialFilterOptions }: CourseSearchingProps) {
    const router = useRouter();
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

    const handleSearch = async () => {
        // Build search filters according to API_DOC
        // GET /courses supports: search, country (array), level (array), university (array), intake (array)
        const params = new URLSearchParams();
        
        if (selectedCountry) {
            const country = countries.find(c => c.id === selectedCountry);
            if (country) params.append('country', country.name);
        }
        
        if (selectedUniversity) {
            const university = universities.find(u => u.id === selectedUniversity);
            if (university) params.append('university', university.name);
        }
        
        if (selectedLevel) {
            params.append('level', selectedLevel);
        }
        
        if (selectedIntakes.size > 0) {
            Array.from(selectedIntakes).forEach(intake => {
                params.append('intake', intake);
            });
        }
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }

        // Navigate to search results page with filters as query params
        router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
    };

    return (
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
    );
}