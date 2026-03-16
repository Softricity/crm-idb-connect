import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto, REPORT_TYPES, ReportType } from './dto/report-query.dto';
import ExcelJS from 'exceljs';

export interface ReportDataResponse {
  items: Record<string, any>[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReportData(type: string, rawQuery: Record<string, any>, user: any): Promise<ReportDataResponse> {
    this.assertType(type);
    const query = this.normalizeQuery(rawQuery);

    const reportType = type as ReportType;
    const rows = await this.getFilteredRows(reportType, query, rawQuery, user);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const start = (page - 1) * pageSize;

    return {
      items: rows.slice(start, start + pageSize),
      total: rows.length,
      page,
      pageSize,
    };
  }

  async getFilterOptions(type: string, rawQuery: Record<string, any>, user: any): Promise<Record<string, string[]>> {
    this.assertType(type);
    const query = this.normalizeQuery(rawQuery);

    const reportType = type as ReportType;
    const rawRows = await this.getBaseRows(reportType, query, user);
    const rowKeys = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

    const options: Record<string, string[]> = {};
    rowKeys.forEach((key) => {
      if (this.isSystemField(key)) {
        return;
      }
      const values = Array.from(
        new Set(
          rawRows
            .map((row) => this.stringValue(row[key]))
            .filter((value) => value && value !== '-' && value !== 'null'),
        ),
      ).sort((a, b) => a.localeCompare(b));

      if (values.length > 0 && values.length <= 200) {
        options[key] = values;
      }
    });

    return options;
  }

  async exportReport(type: string, rawQuery: Record<string, any>, user: any) {
    this.assertType(type);
    const query = this.normalizeQuery(rawQuery);
    const reportType = type as ReportType;
    const rows = await this.getFilteredRows(reportType, query, rawQuery, user);

    const requestedColumns = this.parseList(rawQuery.columns ?? query.columns);
    const columns = requestedColumns.length > 0
      ? requestedColumns
      : this.getDefaultColumns(rows);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.getSheetName(reportType));

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.addRow(columns);

    rows.forEach((row) => {
      worksheet.addRow(columns.map((col) => this.stringValue(row[col])));
    });

    worksheet.columns = columns.map((col) => ({
      key: col,
      width: Math.max(14, Math.min(36, col.length + 6)),
    }));

    const header = worksheet.getRow(1);
    header.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().toISOString().slice(0, 10);

    return {
      buffer,
      filename: `${type}_report_${timestamp}.xlsx`,
    };
  }

  private async getFilteredRows(type: ReportType, query: ReportQueryDto, rawQuery: Record<string, any>, user: any) {
    const rows = await this.getBaseRows(type, query, user);
    const filterMap = this.extractFilters(rawQuery);

    let filtered = this.applySearch(rows, query.search);
    filtered = this.applyFilters(filtered, filterMap);
    filtered = this.applySort(filtered, query.sortBy, query.sortOrder ?? 'desc');

    return filtered;
  }

  private async getBaseRows(type: ReportType, query: ReportQueryDto, user: any): Promise<Record<string, any>[]> {
    switch (type) {
      case 'study-lead':
        return this.getStudyLeadRows(query, user);
      case 'counselling':
        return this.getCounsellingRows(query, user);
      case 'admission':
        return this.getAdmissionRows(query, user);
      case 'application':
        return this.getApplicationRows(query, user);
      case 'visa':
        return this.getVisaRows(query, user);
      case 'payment':
        return this.getPaymentRows(query, user);
      case 'follow-up':
        return this.getFollowUpRows(query, user);
      default:
        return [];
    }
  }

  private async getStudyLeadRows(query: ReportQueryDto, user: any) {
    const leads = await this.prisma.leads.findMany({
      where: {
        type: 'lead',
        ...this.getScopedLeadFilter(query.branch_id, user),
      },
      include: {
        branch: { select: { name: true } },
        partners_leads_assigned_toTopartners: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return leads.map((lead) => ({
      id: lead.id,
      serial_no: lead.id?.slice(0, 8) ?? '-',
      created_at: lead.created_at,
      timeline: this.getTimelineBucket(lead.created_at),
      given_name: this.firstName(lead.name),
      surname: this.lastName(lead.name),
      email: lead.email,
      phone: lead.mobile,
      visa_type: lead.preferred_course ?? '-',
      lead_status: lead.status ?? '-',
      branch: lead.branch?.name ?? '-',
      lead_counsellor: lead.partners_leads_assigned_toTopartners?.name ?? 'Unassigned',
      preferred_country: lead.preferred_country ?? '-',
      lead_source: lead.utm_source ?? '-',
      resident_city: '-',
      lead_type: lead.type ?? '-',
    }));
  }

  private async getCounsellingRows(query: ReportQueryDto, user: any) {
    const leads = await this.prisma.leads.findMany({
      where: {
        type: { in: ['lead', 'application', 'visa'] },
        ...this.getScopedLeadFilter(query.branch_id, user),
      },
      include: {
        branch: { select: { name: true } },
        partners_leads_assigned_toTopartners: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return leads.map((lead) => ({
      id: lead.id,
      serial_no: lead.id?.slice(0, 8) ?? '-',
      created_at: lead.created_at,
      timeline: this.getTimelineBucket(lead.created_at),
      given_name: this.firstName(lead.name),
      surname: this.lastName(lead.name),
      email: lead.email,
      phone: lead.mobile,
      visa_type: lead.preferred_course ?? '-',
      branch: lead.branch?.name ?? '-',
      counsellor: lead.partners_leads_assigned_toTopartners?.name ?? 'Unassigned',
      counselling_status: lead.status ?? '-',
      lead_source: lead.utm_source ?? '-',
      lead_type: lead.type ?? '-',
    }));
  }

  private async getAdmissionRows(query: ReportQueryDto, user: any) {
    const leads = await this.prisma.leads.findMany({
      where: {
        type: { in: ['application', 'visa'] },
        ...this.getScopedLeadFilter(query.branch_id, user),
      },
      include: {
        branch: { select: { name: true } },
        partners_leads_assigned_toTopartners: { select: { name: true } },
        applications: { include: { preferences: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return leads.map((lead) => {
      const application = lead.applications?.[0];
      return {
        id: lead.id,
        serial_no: lead.id?.slice(0, 8) ?? '-',
        created_at: lead.created_at,
        timeline: this.getTimelineBucket(lead.created_at),
        given_name: application?.given_name ?? this.firstName(lead.name),
        surname: application?.surname ?? this.lastName(lead.name),
        email: application?.email ?? lead.email,
        phone: application?.phone ?? lead.mobile,
        visa_type: lead.preferred_course ?? '-',
        branch: lead.branch?.name ?? '-',
        admission_status: application?.application_stage ?? lead.status ?? '-',
        admission_manager: lead.partners_leads_assigned_toTopartners?.name ?? 'Unassigned',
        lead_source: lead.utm_source ?? '-',
      };
    });
  }

  private async getApplicationRows(query: ReportQueryDto, user: any) {
    const leads = await this.prisma.leads.findMany({
      where: {
        type: 'application',
        ...this.getScopedLeadFilter(query.branch_id, user),
      },
      include: {
        branch: { select: { name: true } },
        partners_leads_assigned_toTopartners: { select: { name: true } },
        applications: { include: { preferences: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return leads.map((lead) => {
      const application = lead.applications?.[0];
      const pref = application?.preferences?.[0];
      return {
        id: lead.id,
        serial_no: lead.id?.slice(0, 8) ?? '-',
        created_at: lead.created_at,
        timeline: this.getTimelineBucket(lead.created_at),
        given_name: application?.given_name ?? this.firstName(lead.name),
        surname: application?.surname ?? this.lastName(lead.name),
        email: application?.email ?? lead.email,
        phone: application?.phone ?? lead.mobile,
        country: pref?.preferred_country ?? application?.country ?? lead.preferred_country ?? '-',
        application_status: application?.application_stage ?? lead.status ?? '-',
        branch: lead.branch?.name ?? '-',
        admission_manager: lead.partners_leads_assigned_toTopartners?.name ?? 'Unassigned',
        visa_type: lead.preferred_course ?? '-',
      };
    });
  }

  private async getVisaRows(query: ReportQueryDto, user: any) {
    const leads = await this.prisma.leads.findMany({
      where: {
        type: { in: ['application', 'visa'] },
        ...this.getScopedLeadFilter(query.branch_id, user),
      },
      include: {
        branch: { select: { name: true } },
        partners_leads_assigned_toTopartners: { select: { name: true } },
        applications: { include: { visa_details: true, preferences: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return leads.map((lead) => {
      const app = lead.applications?.[0];
      const visa = app?.visa_details?.[0];
      const pref = app?.preferences?.[0];
      return {
        id: lead.id,
        serial_no: lead.id?.slice(0, 8) ?? '-',
        created_at: lead.created_at,
        timeline: this.getTimelineBucket(lead.created_at),
        given_name: app?.given_name ?? this.firstName(lead.name),
        surname: app?.surname ?? this.lastName(lead.name),
        email: app?.email ?? lead.email,
        phone: app?.phone ?? lead.mobile,
        country: pref?.preferred_country ?? app?.country ?? lead.preferred_country ?? '-',
        visa_status: visa?.visa_status ?? lead.status ?? '-',
        branch: lead.branch?.name ?? '-',
        visa_manager: lead.partners_leads_assigned_toTopartners?.name ?? 'Unassigned',
        applied_via: lead.agent_id ? 'Agent' : 'Self',
        intake: pref?.preferred_intake ?? '-',
        visa_type: lead.preferred_course ?? '-',
      };
    });
  }

  private async getPaymentRows(query: ReportQueryDto, user: any) {
    const payments = await this.prisma.offline_payments.findMany({
      where: {
        ...(query.branch_id
          ? { leads: { branch_id: query.branch_id } }
          : this.getScopedPaymentFilter(user)),
      },
      include: {
        leads: {
          include: {
            branch: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return payments.map((payment) => ({
      id: payment.id,
      serial_no: payment.id?.slice(0, 8) ?? '-',
      created_at: payment.created_at,
      timeline: this.getTimelineBucket(payment.created_at),
      given_name: this.firstName(payment.leads?.name ?? '-'),
      surname: this.lastName(payment.leads?.name ?? '-'),
      email: payment.leads?.email ?? '-',
      phone: payment.leads?.mobile ?? '-',
      lead_type: payment.leads?.type ?? '-',
      payment_status: payment.status ?? '-',
      currency: payment.currency ?? '-',
      payment_amount: this.stringValue(payment.amount),
      payment_type: payment.payment_type ?? '-',
      payment_mode: payment.payment_mode ?? '-',
      payment_stage: payment.reference_id ? 'Payment Recorded' : 'Payment Scheduled',
      lead_source: payment.leads?.utm_source ?? '-',
      branch: payment.leads?.branch?.name ?? '-',
    }));
  }

  private async getFollowUpRows(query: ReportQueryDto, user: any) {
    const followups = await this.prisma.followups.findMany({
      where: {
        ...(query.branch_id
          ? { leads: { branch_id: query.branch_id } }
          : this.getScopedFollowupFilter(user)),
      },
      include: {
        leads: {
          include: {
            branch: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return followups.map((followup) => ({
      id: followup.id,
      serial_no: followup.id?.slice(0, 8) ?? '-',
      created_at: followup.created_at,
      due_date: followup.due_date,
      timeline: this.getTimelineBucket(followup.due_date ?? followup.created_at),
      given_name: this.firstName(followup.leads?.name ?? '-'),
      surname: this.lastName(followup.leads?.name ?? '-'),
      phone: followup.leads?.mobile ?? '-',
      branch: followup.leads?.branch?.name ?? '-',
      follow_up: followup.title ?? '-',
      entity: followup.leads?.type ?? 'Lead',
      status: followup.completed ? 'Completed' : 'Pending',
      lead_type: followup.leads?.type ?? '-',
    }));
  }

  private getScopedLeadFilter(branchId: string | undefined, user: any) {
    if (branchId) {
      const userBranch = this.getUserBranchScope(user);
      if (userBranch && userBranch !== branchId) {
        return { branch_id: '__forbidden_branch__' };
      }
      return { branch_id: branchId };
    }

    const userBranch = this.getUserBranchScope(user);
    return userBranch ? { branch_id: userBranch } : {};
  }

  private getScopedPaymentFilter(user: any) {
    const userBranch = this.getUserBranchScope(user);
    return userBranch ? { leads: { branch_id: userBranch } } : {};
  }

  private getScopedFollowupFilter(user: any) {
    const userBranch = this.getUserBranchScope(user);
    return userBranch ? { leads: { branch_id: userBranch } } : {};
  }

  private getUserBranchScope(user: any): string | null {
    const roleName = user?.role?.name || user?.role;
    const isHeadOfficeAdmin = user?.branch_type === 'HeadOffice' && roleName === 'admin';
    if (isHeadOfficeAdmin) {
      return null;
    }
    return user?.branch_id ?? '00000000-0000-0000-0000-000000000000';
  }

  private extractFilters(rawQuery: Record<string, any>) {
    const reserved = new Set(['page', 'pageSize', 'sortBy', 'sortOrder', 'branch_id', 'columns', 'search']);
    const filterMap: Record<string, string[]> = {};

    Object.entries(rawQuery || {}).forEach(([key, value]) => {
      if (reserved.has(key)) {
        return;
      }
      const list = this.parseList(value);
      if (list.length > 0) {
        filterMap[key] = list;
      }
    });

    return filterMap;
  }

  private applySearch(rows: Record<string, any>[], search?: string) {
    if (!search || !search.trim()) {
      return rows;
    }

    const needle = search.trim().toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((value) => this.stringValue(value).toLowerCase().includes(needle)),
    );
  }

  private applyFilters(rows: Record<string, any>[], filters: Record<string, string[]>) {
    const entries = Object.entries(filters);
    if (entries.length === 0) {
      return rows;
    }

    return rows.filter((row) =>
      entries.every(([key, values]) => {
        const rowValue = this.stringValue(row[key]).toLowerCase();
        const normalized = values.map((value) => value.toLowerCase());
        return normalized.includes(rowValue);
      }),
    );
  }

  private applySort(rows: Record<string, any>[], sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const sortKey = sortBy && rows.length > 0 && Object.hasOwn(rows[0], sortBy) ? sortBy : 'created_at';
    if (!sortKey || rows.length === 0 || !Object.hasOwn(rows[0], sortKey)) {
      return rows;
    }

    const sorted = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      if (av === bv) return 0;

      const ad = this.toDateValue(av);
      const bd = this.toDateValue(bv);
      if (ad !== null && bd !== null) {
        return ad - bd;
      }

      return this.stringValue(av).localeCompare(this.stringValue(bv));
    });

    return sortOrder === 'desc' ? sorted.reverse() : sorted;
  }

  private getTimelineBucket(dateInput: any): string {
    const timestamp = this.toDateValue(dateInput);
    if (timestamp === null) {
      return '-';
    }

    const now = Date.now();
    const diffDays = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'Yesterday';
    if (diffDays <= 7) return '7 Days';
    if (diffDays <= 14) return '14 Days';
    if (diffDays <= 30) return '30 Days';
    return '90 Days';
  }

  private toDateValue(value: any): number | null {
    if (!value) return null;
    const date = new Date(value);
    const time = date.getTime();
    return Number.isNaN(time) ? null : time;
  }

  private firstName(name?: string | null) {
    return (name || '-').split(' ')[0] || '-';
  }

  private lastName(name?: string | null) {
    const parts = (name || '').split(' ').filter(Boolean);
    if (parts.length <= 1) return '-';
    return parts.slice(1).join(' ');
  }

  private parseList(input: any): string[] {
    if (!input) {
      return [];
    }
    if (Array.isArray(input)) {
      return input.flatMap((part) => this.parseList(part));
    }

    return String(input)
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private stringValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private getDefaultColumns(rows: Record<string, any>[]): string[] {
    if (rows.length === 0) {
      return ['id'];
    }

    return Object.keys(rows[0]).filter((key) => !this.isSystemField(key));
  }

  private isSystemField(key: string): boolean {
    return ['id', 'created_at', 'due_date'].includes(key);
  }

  private getSheetName(type: ReportType): string {
    return type
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private assertType(type: string): void {
    if (!REPORT_TYPES.includes(type as ReportType)) {
      throw new BadRequestException(`Unsupported report type: ${type}`);
    }
  }

  private normalizeQuery(rawQuery: Record<string, any>): ReportQueryDto {
    const pageRaw = Number(rawQuery?.page ?? 1);
    const pageSizeRaw = Number(rawQuery?.pageSize ?? 25);
    const sortOrderRaw = String(rawQuery?.sortOrder ?? 'desc').toLowerCase();

    const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.max(1, Math.min(100, Math.floor(pageSizeRaw)))
      : 25;
    const sortOrder: 'asc' | 'desc' = sortOrderRaw === 'asc' ? 'asc' : 'desc';

    const normalized: ReportQueryDto = {
      page,
      pageSize,
      sortOrder,
    };

    if (rawQuery?.sortBy) normalized.sortBy = String(rawQuery.sortBy);
    if (rawQuery?.branch_id) normalized.branch_id = String(rawQuery.branch_id);
    if (rawQuery?.columns) normalized.columns = String(rawQuery.columns);
    if (rawQuery?.search) normalized.search = String(rawQuery.search);

    return normalized;
  }
}
