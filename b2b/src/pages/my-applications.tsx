import { GetServerSideProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ApplicationsTable, { Lead } from '@/components/applications/ApplicationsTable';
import CreateApplicationModal from '@/components/applications/CreateApplicationModal';
import { Select, SelectItem, Button, Input } from '@heroui/react';
import { Plus, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { LeadsAPI } from '@/lib/api';

interface MyApplicationsProps {
    allLeads: Lead[];
    initialSearch?: string;
    initialStatus?: string;
    initialSortBy?: string;
    initialSortOrder?: string;
    initialPage?: number;
}

const MyApplications = ({ 
    allLeads, 
    initialSearch = '', 
    initialStatus = '', 
    initialSortBy = 'created_at', 
    initialSortOrder = 'desc',
    initialPage = 1
}: MyApplicationsProps) => {
    const router = useRouter();
    const [searchInput, setSearchInput] = useState(initialSearch);
    const [selectedStatus, setSelectedStatus] = useState(initialStatus);
    const [selectedSort, setSelectedSort] = useState(initialSortBy);
    const [selectedOrder, setSelectedOrder] = useState(initialSortOrder);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const limit = 20;

    // Client-side filtering, sorting, and pagination
    const { filteredLeads, totalPages, totalCount } = useMemo(() => {
        let filtered = [...allLeads];

        // Apply search filter
        if (searchInput) {
            const searchLower = searchInput.toLowerCase();
            filtered = filtered.filter(lead => 
                lead.name?.toLowerCase().includes(searchLower) ||
                lead.email?.toLowerCase().includes(searchLower) ||
                lead.mobile?.includes(searchInput)
            );
        }

        // Apply status filter
        if (selectedStatus) {
            filtered = filtered.filter(lead => lead.status?.toLowerCase() === selectedStatus.toLowerCase());
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any = a[selectedSort as keyof Lead];
            let bValue: any = b[selectedSort as keyof Lead];

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
        const paginatedLeads = filtered.slice(startIndex, startIndex + limit);

        return {
            filteredLeads: paginatedLeads,
            totalPages,
            totalCount
        };
    }, [allLeads, searchInput, selectedStatus, selectedSort, selectedOrder, currentPage, limit]);

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'new', label: 'New' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'interested', label: 'Interested' },
        { value: 'engaged', label: 'Engaged' },
        { value: 'hot', label: 'Hot' },
        { value: 'cold', label: 'Cold' },
        { value: 'rejected', label: 'Rejected' },
    ];

    const handleSearch = () => {
        setCurrentPage(1);
        const params = new URLSearchParams();
        if (searchInput) params.set('search', searchInput);
        if (selectedStatus) params.set('status', selectedStatus);
        if (selectedSort) params.set('sortBy', selectedSort);
        if (selectedOrder) params.set('sortOrder', selectedOrder);
        router.push(`/my-applications?${params.toString()}`, undefined, { shallow: true });
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        const params = new URLSearchParams();
        if (searchInput) params.set('search', searchInput);
        if (selectedStatus) params.set('status', selectedStatus);
        if (selectedSort) params.set('sortBy', selectedSort);
        if (selectedOrder) params.set('sortOrder', selectedOrder);
        params.set('page', newPage.toString());
        router.push(`/my-applications?${params.toString()}`, undefined, { shallow: true });
    };

    const handleSort = (columnKey: string) => {
        setCurrentPage(1);
        
        // Toggle order if clicking the same column, otherwise default to desc
        let newOrder = 'desc';
        if (selectedSort === columnKey) {
            newOrder = selectedOrder === 'desc' ? 'asc' : 'desc';
        }
        
        setSelectedSort(columnKey);
        setSelectedOrder(newOrder);
        
        const params = new URLSearchParams();
        if (searchInput) params.set('search', searchInput);
        if (selectedStatus) params.set('status', selectedStatus);
        params.set('sortBy', columnKey);
        params.set('sortOrder', newOrder);
        router.push(`/my-applications?${params.toString()}`, undefined, { shallow: true });
    };

    const handleClearFilters = () => {
        setSearchInput('');
        setSelectedStatus('');
        setCurrentPage(1);
        const params = new URLSearchParams();
        params.set('sortBy', selectedSort);
        params.set('sortOrder', selectedOrder);
        router.push(`/my-applications?${params.toString()}`, undefined, { shallow: true });
    };

    const handleCreateSuccess = () => {
        // Refresh the page to show new application
        router.replace(router.asPath);
    };

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                <div className="flex justify-end items-center">
                    <Button
                        className="mb-6 rounded-xl text-white px-5 py-2 bg-linear-to-r from-blue-900/80 to-blue-950"
                        onPress={() => setIsCreateModalOpen(true)}
                        startContent={<Plus className="w-5 h-5 stroke-[1.25px]" />}
                    >
                        Create New Application
                    </Button>
                </div>
                {/* Filters Section */}
                <div className="bg-linear-to-br from-blue-700/80 to-blue-950 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        {/* Status Filter */}
                        <Select
                            label="Status"
                            placeholder="Select status"
                            selectedKeys={selectedStatus ? [selectedStatus] : []}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string;
                                setSelectedStatus(value);
                            }}
                            size='sm'
                            classNames={{
                                label: "text-white",
                                trigger: "bg-white rounded-xl border-0"
                            }}
                        >
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </Select>

                        {/* Search Input */}
                        <div className="md:col-span-2 flex items-center gap-2">
                            {/* <div className="flex grow items-center bg-white px-3 py-1 rounded-xl focus-within:ring-2 focus-within:ring-white/50">
                                <Search className="w-5 h-5 stroke-[1.25px] mr-1 text-gray-400" />
                                <input
                                    type="text"
                                    className="grow focus:ring-0 focus:outline-none border-0 p-2"
                                    placeholder="Search by name, email, or phone..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div> */}
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
                                placeholder="Search by name, email, or phone..."
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
                </div>

                {/* Table */}
                <ApplicationsTable
                    leads={filteredLeads}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    sortBy={selectedSort}
                    sortOrder={selectedOrder as 'asc' | 'desc'}
                    onSort={handleSort}
                />

                {/* Create Application Modal */}
                <CreateApplicationModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={handleCreateSuccess}
                />
            </div>
        </ProtectedRoute>
    );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const { req, query } = ctx;
    
    // Get auth token and user data from cookies
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = decodeURIComponent(value);
        return acc;
    }, {} as Record<string, string>);

    const token = cookies?.['auth-token'];
    const userStr = cookies?.['auth-user'];

    if (!token || !userStr) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }

    // Parse user data to check permissions
    let user;
    try {
        user = JSON.parse(userStr);
    } catch (error) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }

    const hasBranchManagePermission = user?.permissions?.some(
        (perm: any) => perm.name === 'Branch Manage' || perm === 'Branch Manage'
    );

    try {
        const createdBy = hasBranchManagePermission ? undefined : user.id;
        const data = await LeadsAPI.getMyApplications(createdBy, token);

        return {
            props: {
                allLeads: data || [],
                initialSearch: (query.search as string) || '',
                initialStatus: (query.status as string) || '',
                initialSortBy: (query.sortBy as string) || 'created_at',
                initialSortOrder: (query.sortOrder as string) || 'desc',
                initialPage: parseInt(query.page as string) || 1,
            },
        };
    } catch (error) {
        console.error('Error fetching applications:', error);
        return {
            props: {
                allLeads: [],
                initialSearch: '',
                initialStatus: '',
                initialSortBy: 'created_at',
                initialSortOrder: 'desc',
                initialPage: 1,
            },
        };
    }
}

export default MyApplications
