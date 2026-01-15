import { GetServerSideProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CommissionsTable, { Commission } from '@/components/commissions/CommissionsTable';
import { Select, SelectItem, Button, Input, Card, CardBody } from '@heroui/react';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { CommissionsAPI } from '@/lib/api';

interface CommissionHubProps {
    allCommissions: Commission[];
    initialSearch?: string;
    initialStatus?: string;
    initialSortBy?: string;
    initialSortOrder?: string;
    initialPage?: number;
}

const CommissionHub = ({ 
    allCommissions, 
    initialSearch = '', 
    initialStatus = '',
    initialSortBy = 'created_at', 
    initialSortOrder = 'desc',
    initialPage = 1
}: CommissionHubProps) => {
    const router = useRouter();
    const [searchInput, setSearchInput] = useState(initialSearch);
    const [selectedStatus, setSelectedStatus] = useState(initialStatus);
    const [selectedSort, setSelectedSort] = useState(initialSortBy);
    const [selectedOrder, setSelectedOrder] = useState(initialSortOrder);
    const [currentPage, setCurrentPage] = useState(initialPage);
    
    const limit = 20;

    const calculateTotals = (commissions: Commission[]) => {
        const totals = commissions.reduce((acc, commission) => {
            if (!acc[commission.currency]) {
                acc[commission.currency] = { total: 0, paid: 0, pending: 0, approved: 0 };
            }
            const amount = Number(commission.amount) || 0;
            acc[commission.currency].total += amount;
            if (commission.status === 'PAID') {
                acc[commission.currency].paid += amount;
            } else if (commission.status === 'PENDING') {
                acc[commission.currency].pending += amount;
            } else if (commission.status === 'APPROVED') {
                acc[commission.currency].approved += amount;
            }
            return acc;
        }, {} as Record<string, { total: number; paid: number; pending: number; approved: number }>);
        return totals;
    };

    // Client-side filtering, sorting, and pagination
    const { filteredCommissions, totalPages, totalCount, totals } = useMemo(() => {
        let filtered = [...allCommissions];

        // Apply search filter
        if (searchInput) {
            const searchLower = searchInput.toLowerCase();
            filtered = filtered.filter(commission => 
                commission.lead?.name?.toLowerCase().includes(searchLower) ||
                commission.remarks?.toLowerCase().includes(searchLower)
            );
        }

        // Apply status filter
        if (selectedStatus) {
            filtered = filtered.filter(commission => commission.status === selectedStatus);
        }

        // Calculate totals for filtered results
        const totals = calculateTotals(filtered);

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            if (selectedSort === 'created_at') {
                aValue = new Date(a.created_at).getTime();
                bValue = new Date(b.created_at).getTime();
            } else if (selectedSort === 'amount') {
                aValue = a.amount;
                bValue = b.amount;
            } else if (selectedSort === 'status') {
                aValue = a.status;
                bValue = b.status;
            } else {
                aValue = a[selectedSort as keyof Commission];
                bValue = b[selectedSort as keyof Commission];
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
        const paginatedCommissions = filtered.slice(startIndex, startIndex + limit);

        return {
            filteredCommissions: paginatedCommissions,
            totalPages,
            totalCount,
            totals
        };
    }, [allCommissions, searchInput, selectedStatus, selectedSort, selectedOrder, currentPage, limit]);

    const handleSearch = () => {
        setCurrentPage(1);
        const params = new URLSearchParams();
        if (searchInput) params.set('search', searchInput);
        if (selectedStatus) params.set('status', selectedStatus);
        if (selectedSort) params.set('sortBy', selectedSort);
        if (selectedOrder) params.set('sortOrder', selectedOrder);
        router.push(`/commission-hub?${params.toString()}`, undefined, { shallow: true });
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        const params = new URLSearchParams();
        if (searchInput) params.set('search', searchInput);
        if (selectedStatus) params.set('status', selectedStatus);
        if (selectedSort) params.set('sortBy', selectedSort);
        if (selectedOrder) params.set('sortOrder', selectedOrder);
        params.set('page', newPage.toString());
        router.push(`/commission-hub?${params.toString()}`, undefined, { shallow: true });
    };

    const handleSort = (columnKey: string) => {
        setCurrentPage(1);
        
        // Toggle order if clicking the same column, otherwise default to desc for dates, asc for others
        let newOrder = columnKey === 'created_at' ? 'desc' : 'asc';
        if (selectedSort === columnKey) {
            newOrder = selectedOrder === 'asc' ? 'desc' : 'asc';
        }
        
        setSelectedSort(columnKey);
        setSelectedOrder(newOrder);
        
        const params = new URLSearchParams();
        if (searchInput) params.set('search', searchInput);
        if (selectedStatus) params.set('status', selectedStatus);
        params.set('sortBy', columnKey);
        params.set('sortOrder', newOrder);
        router.push(`/commission-hub?${params.toString()}`, undefined, { shallow: true });
    };

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="bg-linear-to-br from-blue-700/80 to-blue-950 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(totals).map(([currency, amounts]) => (
                            <div key={currency} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                <p className="text-sm text-white/80 mb-1">Total ({currency})</p>
                                <p className="text-3xl font-bold text-white">{amounts.total.toLocaleString()}</p>
                                <div className="mt-3 space-y-1.5 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-green-300">Paid:</span>
                                        <span className="font-semibold text-white">{amounts.paid.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-300">Approved:</span>
                                        <span className="font-semibold text-white">{amounts.approved.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-yellow-300">Pending:</span>
                                        <span className="font-semibold text-white">{amounts.pending.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Search Section */}
                <div className="bg-linear-to-br from-blue-700/80 to-blue-950 rounded-xl p-6">
                    <div className="flex flex-col md:flex-row items-center gap-3">
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
                                mainWrapper: "flex-1",
                            }}
                            label="Search"
                            startContent={<Search className="w-4 h-5 stroke-[1.25px] text-gray-400" />}
                            placeholder="Search by lead name or remarks..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onClear={() => setSearchInput('')}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            radius='lg'
                            size='sm'
                        />
                        <Select
                            label="Status"
                            placeholder="All statuses"
                            selectedKeys={selectedStatus ? [selectedStatus] : []}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            classNames={{
                                trigger: "bg-white h-12",
                                label: "text-black/50",
                                value: "text-black/90",
                                mainWrapper: "w-full md:w-48",
                            }}
                            radius='lg'
                            size='sm'
                        >
                            <SelectItem key="">All Statuses</SelectItem>
                            <SelectItem key="PENDING">Pending</SelectItem>
                            <SelectItem key="APPROVED">Approved</SelectItem>
                            <SelectItem key="PAID">Paid</SelectItem>
                            <SelectItem key="REJECTED">Rejected</SelectItem>
                        </Select>
                        <Button
                            className="w-full md:w-28 h-12 bg-black text-white font-semibold"
                            onPress={handleSearch}
                            style={{ background: 'linear-gradient(90deg, #bc4e9c, #f80759)' }}
                        >
                            Search
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <CommissionsTable
                    commissions={filteredCommissions}
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
        // Fetch all commissions
        const data = await CommissionsAPI.getMyCommissions(token);

        return {
            props: {
                allCommissions: data || [],
                initialSearch: (query.search as string) || '',
                initialStatus: (query.status as string) || '',
                initialSortBy: (query.sortBy as string) || 'created_at',
                initialSortOrder: (query.sortOrder as string) || 'desc',
                initialPage: parseInt(query.page as string) || 1,
            },
        };
    } catch (error) {
        console.error('Error fetching commissions:', error);
        return {
            props: {
                allCommissions: [],
                initialSearch: '',
                initialStatus: '',
                initialSortBy: 'created_at',
                initialSortOrder: 'desc',
                initialPage: 1,
            },
        };
    }
}

export default CommissionHub