// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { getScope } from '../common/utils/scope.util'; // <--- 1. IMPORT THIS

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

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