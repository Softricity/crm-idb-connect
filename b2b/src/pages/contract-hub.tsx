import { GetServerSideProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UniversitiesTable, { University } from '@/components/contracts/UniversitiesTable';
import { Select, SelectItem, Button, Input } from '@heroui/react';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { UniversitiesAPI } from '@/lib/api';

interface ContractHubProps {
    allUniversities: University[];
    initialSearch?: string;
    initialSortBy?: string;
    initialSortOrder?: string;
    initialPage?: number;
}

const ContractHub = ({ 
    allUniversities, 
    initialSearch = '', 
    initialSortBy = 'name', 
    initialSortOrder = 'asc',
    initialPage = 1
}: ContractHubProps) => {
    const router = useRouter();
    const [searchInput, setSearchInput] = useState(initialSearch);
    const [selectedSort, setSelectedSort] = useState(initialSortBy);
    const [selectedOrder, setSelectedOrder] = useState(initialSortOrder);
    const [currentPage, setCurrentPage] = useState(initialPage);
    
    const limit = 20;

    // Client-side filtering, sorting, and pagination
    const { filteredUniversities, totalPages, totalCount } = useMemo(() => {
        let filtered = [...allUniversities];

        // Apply search filter
        if (searchInput) {
            const searchLower = searchInput.toLowerCase();
            filtered = filtered.filter(uni => 
                uni.name?.toLowerCase().includes(searchLower) ||
                uni.city?.toLowerCase().includes(searchLower) ||
                uni.country?.name?.toLowerCase().includes(searchLower)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            if (selectedSort === 'country') {
                aValue = a.country?.name;
                bValue = b.country?.name;
            } else if (selectedSort === 'courses') {
                aValue = a._count?.courses || 0;
                bValue = b._count?.courses || 0;
            } else {
                aValue = a[selectedSort as keyof University];
                bValue = b[selectedSort as keyof University];
            }

            // Handle null/undefined values
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            // Convert to lowercase for string comparison
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            // Compare
            if (aValue < bValue) return selectedOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return selectedOrder === 'asc' ? 1 : -1;
            return 0;
        });

        // Calculate pagination
        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / limit);
        const startIndex = (currentPage - 1) * limit;
        const paginatedUniversities = filtered.slice(startIndex, startIndex + limit);

        return {
            filteredUniversities: paginatedUniversities,
            totalPages,
            totalCount
        };
    }, [allUniversities, searchInput, selectedSort, selectedOrder, currentPage, limit]);

    const handleSearch = () => {
        setCurrentPage(1);
        const params = new URLSearchParams();
        if (searchInput) params.set('search', searchInput);
        if (selectedSort) params.set('sortBy', selectedSort);
        if (selectedOrder) params.set('sortOrder', selectedOrder);
        router.push(`/contract-hub?${params.toString()}`, undefined, { shallow: true });
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        const params = new URLSearchParams();
        if (searchInput) params.set('search', searchInput);
        if (selectedSort) params.set('sortBy', selectedSort);
        if (selectedOrder) params.set('sortOrder', selectedOrder);
        params.set('page', newPage.toString());
        router.push(`/contract-hub?${params.toString()}`, undefined, { shallow: true });
    };

    const handleSort = (columnKey: string) => {
        setCurrentPage(1);
        
        // Toggle order if clicking the same column, otherwise default to asc
        let newOrder = 'asc';
        if (selectedSort === columnKey) {
            newOrder = selectedOrder === 'asc' ? 'desc' : 'asc';
        }
        
        setSelectedSort(columnKey);
        setSelectedOrder(newOrder);
        
        const params = new URLSearchParams();
        if (searchInput) params.set('search', searchInput);
        params.set('sortBy', columnKey);
        params.set('sortOrder', newOrder);
        router.push(`/contract-hub?${params.toString()}`, undefined, { shallow: true });
    };

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Contract Hub</h1>
                        <p className="text-gray-600 mt-1">
                            Showing {filteredUniversities.length} of {totalCount} universities
                        </p>
                    </div>
                </div>

                {/* Search Section */}
                <div className="bg-linear-to-br from-blue-700/80 to-blue-950 rounded-xl p-6">
                    <div className="flex items-center gap-2">
                        <Input
                            isClearable
                            classNames={{
                                label: "text-black/50 dark:text-white/90",
                                input: [
                                    "bg-white",
                                    "text-black/90 dark:text-white/90",
                                    "placeholder:text-default-700/50 dark:placeholder:text-white/60",
                                ],
                                innerWrapper: "bg-white",
                                inputWrapper: [
                                    "shadow-sm bg-white data-[hover=true]:bg-white",
                                    "group-data-[focus=true]:bg-white",
                                    "dark:group-data-[focus=true]:bg-white",
                                    "cursor-text!",
                                ],
                                mainWrapper: "",
                            }}
                            label="Search"
                            startContent={<Search className="w-4 h-5 stroke-[1.25px] text-gray-400" />}
                            placeholder="Search by university name, city, or country..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onClear={() => setSearchInput('')}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            radius='lg'
                            size='sm'
                        />
                        <Button
                            className="w-28 h-12 bg-black text-white font-semibold"
                            onPress={handleSearch}
                            style={{ background: 'linear-gradient(90deg, #bc4e9c, #f80759)' }}
                        >
                            Search
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <UniversitiesTable
                    universities={filteredUniversities}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    sortBy={selectedSort}
                    sortOrder={selectedOrder as 'asc' | 'desc'}
                    onSort={handleSort}
                />
            </div>
        </ProtectedRoute>
    );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const { req, query } = ctx;
    
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
        // Fetch all universities
        const data = await UniversitiesAPI.getAll(undefined, token);

        return {
            props: {
                allUniversities: data || [],
                initialSearch: (query.search as string) || '',
                initialSortBy: (query.sortBy as string) || 'name',
                initialSortOrder: (query.sortOrder as string) || 'asc',
                initialPage: parseInt(query.page as string) || 1,
            },
        };
    } catch (error) {
        console.error('Error fetching universities:', error);
        return {
            props: {
                allUniversities: [],
                initialSearch: '',
                initialSortBy: 'name',
                initialSortOrder: 'asc',
                initialPage: 1,
            },
        };
    }
}

export default ContractHub