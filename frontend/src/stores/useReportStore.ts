import { create } from 'zustand';
import api from '@/lib/api';
import { ReportColumnConfig, ReportQuery, ReportType } from '@/types/reports';

interface ReportState {
  items: Record<string, any>[];
  total: number;
  loading: boolean;
  filtersLoading: boolean;
  error: string | null;
  filterOptions: Record<string, string[]>;
  query: ReportQuery;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setFilters: (filters: Record<string, string[]>) => void;
  clearFilters: () => void;
  fetchData: (type: ReportType, branchId?: string | null) => Promise<void>;
  fetchFilterOptions: (type: ReportType, branchId?: string | null) => Promise<void>;
  downloadXlsx: (type: ReportType, visibleColumns: ReportColumnConfig[], branchId?: string | null) => Promise<void>;
  reset: () => void;
}

const defaultQuery: ReportQuery = {
  page: 1,
  pageSize: 25,
  sortOrder: 'desc',
  filters: {},
};

export const useReportStore = create<ReportState>((set, get) => ({
  items: [],
  total: 0,
  loading: false,
  filtersLoading: false,
  error: null,
  filterOptions: {},
  query: defaultQuery,

  setPage: (page) => set((state) => ({ query: { ...state.query, page } })),
  setPageSize: (pageSize) => set((state) => ({ query: { ...state.query, pageSize, page: 1 } })),
  setSearch: (search) => set((state) => ({ query: { ...state.query, search, page: 1 } })),
  setSort: (sortBy, sortOrder) => set((state) => ({ query: { ...state.query, sortBy, sortOrder } })),
  setFilters: (filters) => set((state) => ({ query: { ...state.query, filters, page: 1 } })),
  clearFilters: () => set((state) => ({ query: { ...state.query, filters: {}, page: 1 } })),

  fetchData: async (type, branchId) => {
    set({ loading: true, error: null });
    try {
      const { query } = get();
      const payload: Record<string, any> = {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        search: query.search,
      };

      if (branchId) {
        payload.branch_id = branchId;
      }

      Object.entries(query.filters).forEach(([key, values]) => {
        if (values.length > 0) {
          payload[key] = values;
        }
      });

      const data = await api.ReportsAPI.getReportData(type, payload);
      set({
        items: data.items || [],
        total: data.total || 0,
      });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch report data' });
    } finally {
      set({ loading: false });
    }
  },

  fetchFilterOptions: async (type, branchId) => {
    set({ filtersLoading: true });
    try {
      const query = branchId ? { branch_id: branchId } : undefined;
      const data = await api.ReportsAPI.getReportFilterOptions(type, query);
      set({ filterOptions: data || {} });
    } catch {
      set({ filterOptions: {} });
    } finally {
      set({ filtersLoading: false });
    }
  },

  downloadXlsx: async (type, visibleColumns, branchId) => {
    const { query } = get();
    const payload: Record<string, any> = {
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      search: query.search,
      columns: visibleColumns.filter((c) => c.visible).map((c) => c.key),
    };

    if (branchId) {
      payload.branch_id = branchId;
    }

    Object.entries(query.filters).forEach(([key, values]) => {
      if (values.length > 0) {
        payload[key] = values;
      }
    });

    const { blob, filename } = await api.ReportsAPI.downloadReportXlsx(type, payload);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  reset: () => set({
    items: [],
    total: 0,
    loading: false,
    filtersLoading: false,
    error: null,
    filterOptions: {},
    query: defaultQuery,
  }),
}));
