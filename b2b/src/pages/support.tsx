"use client";

import { useState, useMemo } from 'react';
import { GetServerSideProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DropdownsAPI, SupportAPI } from '@/lib/api';
import { useRouter } from 'next/router';
import { Select, SelectItem, Button, Input } from '@heroui/react';
import { Plus, Search } from 'lucide-react';
import SupportTicketsTable, { Ticket } from '@/components/support/SupportTicketsTable';
import CreateTicketModal from '@/components/support/CreateTicketModal';
import TicketDetailsModal from '@/components/support/TicketDetailsModal';

interface SupportProps {
    allTickets: Ticket[];
    initialStatus?: string;
    initialSortBy?: string;
    initialSortOrder?: string;
    initialPage?: number;
    userRole?: string;
    topics?: string[];
    categories?: string[];
}

const Support = ({ 
    allTickets, 
    initialStatus = '', 
    initialSortBy = 'created_at', 
    initialSortOrder = 'desc',
    initialPage = 1,
    userRole = 'agent',
    topics,
    categories
}: SupportProps) => {
    const router = useRouter();
    const [searchInput, setSearchInput] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(initialStatus);
    const [selectedSort, setSelectedSort] = useState(initialSortBy);
    const [selectedOrder, setSelectedOrder] = useState(initialSortOrder);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    const limit = 20;
    const isAdmin = userRole === 'super_admin' || userRole === 'admin';

    // Client-side filtering, sorting, and pagination
    const { filteredTickets, totalPages, totalCount } = useMemo(() => {
        let filtered = [...allTickets];

        // Apply search filter
        if (searchInput) {
            const searchLower = searchInput.toLowerCase();
            filtered = filtered.filter(ticket => 
                ticket.subject?.toLowerCase().includes(searchLower) ||
                ticket.case_number?.toString().includes(searchInput) ||
                ticket.topic?.toLowerCase().includes(searchLower) ||
                ticket.category?.toLowerCase().includes(searchLower)
            );
        }

        // Apply status filter
        if (selectedStatus) {
            filtered = filtered.filter(ticket => ticket.status === selectedStatus);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any = a[selectedSort as keyof Ticket];
            let bValue: any = b[selectedSort as keyof Ticket];

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
        const paginatedTickets = filtered.slice(startIndex, startIndex + limit);

        return {
            filteredTickets: paginatedTickets,
            totalPages,
            totalCount
        };
    }, [allTickets, searchInput, selectedStatus, selectedSort, selectedOrder, currentPage, limit]);

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'OPEN', label: 'Open' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'AWAITING_REPLY', label: 'Awaiting Reply' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'CLOSED', label: 'Closed' },
    ];

    const handleSearch = () => {
        setCurrentPage(1);
        const params = new URLSearchParams();
        if (searchInput) params.set('search', searchInput);
        if (selectedStatus) params.set('status', selectedStatus);
        if (selectedSort) params.set('sortBy', selectedSort);
        if (selectedOrder) params.set('sortOrder', selectedOrder);
        router.push(`/support?${params.toString()}`, undefined, { shallow: true });
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        const params = new URLSearchParams();
        if (searchInput) params.set('search', searchInput);
        if (selectedStatus) params.set('status', selectedStatus);
        if (selectedSort) params.set('sortBy', selectedSort);
        if (selectedOrder) params.set('sortOrder', selectedOrder);
        params.set('page', newPage.toString());
        router.push(`/support?${params.toString()}`, undefined, { shallow: true });
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
        router.push(`/support?${params.toString()}`, undefined, { shallow: true });
    };

    const handleCreateSuccess = () => {
        // Refresh the page to show new ticket
        router.replace(router.asPath);
    };

    const handleTicketClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsDetailsModalOpen(true);
    };

    const handleDetailsClose = () => {
        setIsDetailsModalOpen(false);
        // Refresh tickets to get updated data
        router.replace(router.asPath);
    };

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                {!isAdmin && (
                    <div className="flex justify-end items-center">
                        <Button
                            className="mb-6 rounded-xl text-white px-5 py-2 bg-linear-to-r from-blue-900/80 to-blue-950"
                            onPress={() => setIsCreateModalOpen(true)}
                            startContent={<Plus className="w-5 h-5 stroke-[1.25px]" />}
                        >
                            Create New Ticket
                        </Button>
                    </div>
                )}

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
                                placeholder="Search by subject, case #, topic..."
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
                <SupportTicketsTable
                    tickets={filteredTickets}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    sortBy={selectedSort}
                    sortOrder={selectedOrder as 'asc' | 'desc'}
                    onSort={handleSort}
                    onTicketClick={handleTicketClick}
                    isAdmin={isAdmin}
                />

                {/* Create Ticket Modal */}
                <CreateTicketModal
                    isOpen={isCreateModalOpen}
                    topics={topics}
                    categories={categories}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={handleCreateSuccess}
                />

                {/* Ticket Details Modal */}
                {selectedTicket && (
                    <TicketDetailsModal
                        isOpen={isDetailsModalOpen}
                        onClose={handleDetailsClose}
                        ticket={selectedTicket}
                        isAdmin={isAdmin}
                    />
                )}
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

    // Parse user data
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

    try {
        const status = query.status as string || '';
        const data = await SupportAPI.getAllTickets(status, token);
        const list = await DropdownsAPI.getList("", token);
        const topics = list.find(item => item.name === "ticket_topics") || { options: [] };
        const categories = list.find(item => item.name === "ticket_category") || { options: [] };
        console.log(topics, categories);

        return {
            props: {
                allTickets: data || [],
                initialStatus: status,
                initialSortBy: (query.sortBy as string) || 'created_at',
                initialSortOrder: (query.sortOrder as string) || 'desc',
                initialPage: parseInt(query.page as string) || 1,
                userRole: user.role || 'agent',
                topics: topics.options,
                categories: categories.options,
            },
        };
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return {
            props: {
                allTickets: [],
                initialStatus: '',
                initialSortBy: 'created_at',
                initialSortOrder: 'desc',
                initialPage: 1,
                userRole: user.role || 'agent',
                topics: [],
                categories: [],
            },
        };
    }
}

export default Support;