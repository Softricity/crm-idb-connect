export const REPORT_TYPES = [
  'study-lead',
  'counselling',
  'admission',
  'application',
  'visa',
  'payment',
  'follow-up',
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export type SortOrder = 'asc' | 'desc';

export type ReportQuery = {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  branch_id?: string;
  search?: string;
  filters: Record<string, string[]>;
};

export type ReportColumnConfig = {
  key: string;
  label: string;
  visible: boolean;
  mandatory?: boolean;
};

export type ReportFilterSection = {
  key: string;
  label: string;
};

export type ReportDataResponse<T = Record<string, unknown>> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ReportFilterOptionsResponse = Record<string, string[]>;

export type ReportDefinition = {
  type: ReportType;
  title: string;
  description: string;
  route: string;
  filters: ReportFilterSection[];
  defaultSortBy: string;
  defaultSortOrder: SortOrder;
  columns: Array<{
    key: string;
    label: string;
    mandatory?: boolean;
    defaultVisible?: boolean;
  }>;
};
