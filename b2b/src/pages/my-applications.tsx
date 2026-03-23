import { GetServerSideProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ApplicationsTable, {
    Lead,
    DepartmentStatusConfig,
} from '@/components/applications/ApplicationsTable';
import CreateApplicationModal from '@/components/applications/CreateApplicationModal';
import { Select, SelectItem, Button, Input } from '@heroui/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { AgentsAPI, DepartmentsAPI, LeadsAPI } from '@/lib/api';

interface MyApplicationsProps {
    allLeads: Lead[];
    teamMembers: { id: string; name: string }[];
    departments: DepartmentConfig[];
    userType?: string;
    initialSearch?: string;
    initialStatus?: string;
    initialSortBy?: string;
    initialSortOrder?: string;
    initialPage?: number;
}

interface DepartmentConfig {
    id: string;
    is_default?: boolean;
    order_index?: number;
    department_statuses?: DepartmentStatusConfig[];
}

const FALLBACK_STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'interested', label: 'Interested' },
    { value: 'engaged', label: 'Engaged' },
    { value: 'hot', label: 'Hot' },
    { value: 'cold', label: 'Cold' },
    { value: 'rejected', label: 'Rejected' },
];

const normalizeStatusToken = (value?: string | null) =>
    (value || '').toString().trim().toLowerCase();

const MyApplications = ({ 
    allLeads, 
    teamMembers,
    departments = [],
    userType = 'agent',
    initialSearch = '', 
    initialStatus = '', 
    initialSortBy = 'created_at', 
    initialSortOrder = 'desc',
    initialPage = 1
}: MyApplicationsProps) => {
    const router = useRouter();
    const [searchInput, setSearchInput] = useState(initialSearch);
    const [selectedStatus, setSelectedStatus] = useState(normalizeStatusToken(initialStatus));
    const [selectedSort, setSelectedSort] = useState(initialSortBy);
    const [selectedOrder, setSelectedOrder] = useState(initialSortOrder);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const isTeamMember = userType === 'agent_team_member';
    
    const limit = 20;

    const activeDepartmentStatuses = useMemo(() => {
        const normalizedDepartments = (departments || []).map((department) => ({
            ...department,
            department_statuses: (department.department_statuses || [])
                .filter((status) => status.is_active !== false)
                .sort((left, right) => {
                    const leftOrder = left.order_index ?? Number.MAX_SAFE_INTEGER;
                    const rightOrder = right.order_index ?? Number.MAX_SAFE_INTEGER;
                    if (leftOrder !== rightOrder) {
                        return leftOrder - rightOrder;
                    }
                    return (left.label || left.key || '').localeCompare(right.label || right.key || '');
                }),
        }));

        if (!normalizedDepartments.length) {
            return [] as DepartmentStatusConfig[];
        }

        const leadDepartmentFrequency = new Map<string, number>();
        allLeads.forEach((lead) => {
            if (!lead.current_department_id) {
                return;
            }
            leadDepartmentFrequency.set(
                lead.current_department_id,
                (leadDepartmentFrequency.get(lead.current_department_id) || 0) + 1,
            );
        });

        const mostCommonDepartmentId = Array.from(leadDepartmentFrequency.entries())
            .sort((left, right) => right[1] - left[1])[0]?.[0];

        const activeDepartment =
            normalizedDepartments.find((department) => department.id === mostCommonDepartmentId) ||
            normalizedDepartments.find((department) => department.is_default) ||
            [...normalizedDepartments].sort(
                (left, right) => (left.order_index ?? Number.MAX_SAFE_INTEGER) - (right.order_index ?? Number.MAX_SAFE_INTEGER),
            )[0];

        if (activeDepartment?.department_statuses?.length) {
            return activeDepartment.department_statuses;
        }

        return normalizedDepartments
            .flatMap((department) => department.department_statuses || [])
            .sort((left, right) => {
                const leftOrder = left.order_index ?? Number.MAX_SAFE_INTEGER;
                const rightOrder = right.order_index ?? Number.MAX_SAFE_INTEGER;
                if (leftOrder !== rightOrder) {
                    return leftOrder - rightOrder;
                }
                return (left.label || left.key || '').localeCompare(right.label || right.key || '');
            });
    }, [allLeads, departments]);

    const statusOptions = useMemo(() => {
        if (!activeDepartmentStatuses.length) {
            return FALLBACK_STATUS_OPTIONS;
        }

        const seen = new Set<string>();
        const dynamicOptions = activeDepartmentStatuses
            .map((status) => ({
                value: normalizeStatusToken(status.key || status.label),
                label: status.label?.trim() || status.key,
            }))
            .filter((option) => {
                if (!option.value || seen.has(option.value)) {
                    return false;
                }
                seen.add(option.value);
                return true;
            });

        if (!dynamicOptions.length) {
            return FALLBACK_STATUS_OPTIONS;
        }

        return [{ value: '', label: 'All Statuses' }, ...dynamicOptions];
    }, [activeDepartmentStatuses]);

    useEffect(() => {
        if (!selectedStatus) {
            return;
        }

        const exists = statusOptions.some((option) => option.value === selectedStatus);
        if (!exists) {
            setSelectedStatus('');
        }
    }, [selectedStatus, statusOptions]);

    const { filteredLeads, totalPages, totalCount } = useMemo(() => {
        let filtered = [...allLeads];

        if (searchInput) {
            const searchLower = searchInput.toLowerCase();
            filtered = filtered.filter(lead => 
                lead.name?.toLowerCase().includes(searchLower) ||
                lead.email?.toLowerCase().includes(searchLower) ||
                lead.mobile?.includes(searchInput)
            );
        }

        if (selectedStatus) {
            filtered = filtered.filter(
                (lead) => normalizeStatusToken(lead.status) === selectedStatus,
            );
        }

        filtered.sort((a, b) => {
            let aValue: any = a[selectedSort as keyof Lead];
            let bValue: any = b[selectedSort as keyof Lead];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (aValue < bValue) return selectedOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return selectedOrder === 'asc' ? 1 : -1;
            return 0;
        });

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

    const handleCreateSuccess = () => {
        router.replace(router.asPath);
    };

    const handleAssignTeamMember = async (leadId: string, teamMemberId: string) => {
        try {
            await AgentsAPI.assignLeadToTeamMember(leadId, teamMemberId);
            router.replace(router.asPath);
        } catch (error: any) {
            alert(error?.message || 'Failed to assign team member');
        }
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
                <div className="bg-linear-to-br from-blue-700/80 to-blue-950 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <Select
                            label="Status"
                            placeholder="Select status"
                            selectedKeys={selectedStatus ? [selectedStatus] : []}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string | undefined;
                                setSelectedStatus(normalizeStatusToken(value));
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

                <ApplicationsTable
                    leads={filteredLeads}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    sortBy={selectedSort}
                    sortOrder={selectedOrder as 'asc' | 'desc'}
                    onSort={handleSort}
                    teamMembers={teamMembers}
                    onAssignTeamMember={handleAssignTeamMember}
                    hideTeamAssignment={isTeamMember}
                    departmentStatuses={activeDepartmentStatuses}
                    onForwarded={async () => {
                        await router.replace(router.asPath);
                    }}
                />

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
    
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = decodeURIComponent(value);
        return acc;
    }, {} as Record<string, string>);

    const token = cookies?.['b2b-auth-token'] || cookies?.['auth-token'];
    const userStr = cookies?.['b2b-auth-user'] || cookies?.['auth-user'];

    if (!token || !userStr) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }

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
        const createdBy = user.id;
        const [data, teamMembers, departments] = await Promise.all([
            LeadsAPI.getMyApplications(createdBy, token),
            user.type === 'agent' ? AgentsAPI.getMyTeam(token) : Promise.resolve([]),
            DepartmentsAPI.fetchDepartments(false, token).catch(() => []),
        ]);

        return {
            props: {
                allLeads: data || [],
                teamMembers: (teamMembers || []).map((m: any) => ({ id: m.id, name: m.name })),
                departments: Array.isArray(departments) ? departments : [],
                userType: user.type || 'agent',
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
                teamMembers: [],
                departments: [],
                userType: user.type || 'agent',
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
