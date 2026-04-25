// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, subDays, format, startOfMonth, subMonths } from 'date-fns';
import { getScope } from '../common/utils/scope.util'; // <--- 1. IMPORT THIS

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getApplicationStats(user: any) {
    const scope = getScope(user);
    const whereBase = { 
        type: { in: ['application', 'Application'] }, 
        ...scope 
    };

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [
      totalApps,
      statusGroups,
      countryGroups,
      sourceGroups,
      managerGroups,
      monthlyLeads
    ] = await Promise.all([
      this.prisma.leads.count({ where: whereBase }),
      this.prisma.leads.groupBy({
        by: ['status'],
        where: whereBase,
        _count: { status: true },
      }),
      this.prisma.leads.groupBy({
        by: ['preferred_country'],
        where: whereBase,
        _count: { preferred_country: true },
      }),
      this.prisma.leads.groupBy({
        by: ['utm_source'],
        where: whereBase,
        _count: { utm_source: true },
      }),
      this.prisma.leads.groupBy({
        by: ['assigned_to'],
        where: whereBase,
        _count: { assigned_to: true },
      }),
      // For monthly trend (last 6 months)
      this.prisma.leads.findMany({
        where: {
          ...whereBase,
          created_at: { gte: subDays(startOfMonth(new Date()), 150) }, // ~6 months
        },
        select: { created_at: true },
      }),
    ]);

    const byStatus = statusGroups.reduce((acc, curr) => {
      acc[curr.status || 'unknown'] = curr._count.status;
      return acc;
    }, {});

    const byCountry = countryGroups.reduce((acc, curr) => {
      acc[curr.preferred_country || 'Unknown'] = curr._count.preferred_country;
      return acc;
    }, {});

    const bySource = sourceGroups.reduce((acc, curr) => {
      acc[curr.utm_source || 'Direct'] = curr._count.utm_source;
      return acc;
    }, {});

    // For managers, we might need names. For now, group by ID or use a follow-up if needed.
    // However, the original code used partners_leads_assigned_toTopartners.name.
    // Since this is a groupBy, we only get assigned_to (ID).
    // To keep it simple and match frontend, we'll return the raw count map.
    // Frontend original logic used: app.partners_leads_assigned_toTopartners?.name || "Unassigned"
    
    // Monthly trend mapping
    const monthlyMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        monthlyMap.set(format(d, "MMM yy"), 0);
    }
    
    monthlyLeads.forEach(l => {
        if (l.created_at) {
            const m = format(l.created_at, "MMM yy");
            if (monthlyMap.has(m)) {
                monthlyMap.set(m, (monthlyMap.get(m) || 0) + 1);
            }
        }
    });

    const monthlyTrend = Array.from(monthlyMap.entries()).map(([month, count]) => ({
        month,
        count
    }));

    return {
      total: totalApps,
      byStatus,
      byCountry,
      bySource,
      monthlyTrend,
    };
  }

  async getStats(user: any) {
    // 2. Generate the scope filter (e.g., { branch_id: '...' })
    const scope = getScope(user); 
    
    // 3. Create a base filter merging "Lead Type" + "Scope"
    // Use an IN filter to be safe against casing or different lead type strings
    const whereBase = { 
        type: { in: ['lead', 'Lead', 'STUDENT', 'student'] }, 
        ...scope 
    };

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // 4. Apply 'whereBase' to ALL queries below
    const [
      totalLeads,
      todaysLeads,
      convertedLeads,
      rejectedLeads,
      statusGroups,
      sourceGroups,
    ] = await Promise.all([
      // Total
      this.prisma.leads.count({ where: whereBase }), 
      
      // Today's Leads
      this.prisma.leads.count({
        where: {
          ...whereBase,
          created_at: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // Converted
      this.prisma.leads.count({
        where: { ...whereBase, status: 'converted' },
      }),

      // Rejected
      this.prisma.leads.count({
        where: { ...whereBase, status: 'rejected' },
      }),

      // By Status
      this.prisma.leads.groupBy({
        by: ['status'],
        where: whereBase,
        _count: { status: true },
      }),

      // By Source
      this.prisma.leads.groupBy({
        by: ['utm_source'],
        where: whereBase,
        _count: { utm_source: true },
      }),
    ]);

    // 5. Last 7 Days
    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
    const last7DaysLeads = await this.prisma.leads.findMany({
      where: {
        ...whereBase, // <--- Critical: Apply scope here too
        created_at: { gte: sevenDaysAgo },
      },
      select: { created_at: true },
    });

    // ... (The rest of your logic for mapping maps remains exactly the same) ...
    
    const last7DaysMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const dateLabel = format(subDays(new Date(), i), 'MMM dd');
      last7DaysMap.set(dateLabel, 0);
    }

    last7DaysLeads.forEach((lead) => {
      if (lead.created_at) {
        const dateLabel = format(lead.created_at, 'MMM dd');
        if (last7DaysMap.has(dateLabel)) {
          last7DaysMap.set(dateLabel, (last7DaysMap.get(dateLabel) || 0) + 1);
        }
      }
    });

    const last7Days = Array.from(last7DaysMap.entries()).map(([label, count]) => ({
      label,
      count,
    }));

    const byStatus = statusGroups.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {});

    const bySource = sourceGroups.reduce((acc, curr) => {
      const source = curr.utm_source || 'Direct';
      acc[source] = curr._count.utm_source;
      return acc;
    }, {});

    return {
      metrics: {
        total: totalLeads,
        todaysLeads,
        converted: convertedLeads,
        rejected: rejectedLeads,
      },
      byStatus,
      bySource,
      last7Days,
    };
  }
}