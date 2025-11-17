// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(user: any) {
    // You can add logic here to filter stats based on user role
    // e.g., if (user.role === 'agent') { where.created_by = user.id }
    // For now, we'll return global stats for admins/counsellors.

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // 1. Parallelize independent queries for performance
    const [
      totalLeads,
      todaysLeads,
      convertedLeads,
      rejectedLeads,
      statusGroups,
      sourceGroups,
    ] = await Promise.all([
      // Total
      this.prisma.leads.count({ where: { type: 'lead' } }),
      
      // Today's Leads
      this.prisma.leads.count({
        where: {
          type: 'lead',
          created_at: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // Converted (assuming 'converted' is the status string)
      this.prisma.leads.count({
        where: { type: 'lead', status: 'converted' },
      }),

      // Rejected
      this.prisma.leads.count({
        where: { type: 'lead', status: 'rejected' },
      }),

      // By Status
      this.prisma.leads.groupBy({
        by: ['status'],
        where: { type: 'lead' },
        _count: { status: true },
      }),

      // By Source
      this.prisma.leads.groupBy({
        by: ['utm_source'],
        where: { type: 'lead' },
        _count: { utm_source: true },
      }),
    ]);

    // 2. Calculate Last 7 Days (requires a bit of processing)
    // We fetch leads from the last 7 days efficiently
    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
    const last7DaysLeads = await this.prisma.leads.findMany({
      where: {
        type: 'lead',
        created_at: { gte: sevenDaysAgo },
      },
      select: { created_at: true },
    });

    // Group them by day in memory (faster than 7 separate DB queries)
    const last7DaysMap = new Map<string, number>();
    
    // Initialize map with 0 for all 7 days
    for (let i = 6; i >= 0; i--) {
      const dateLabel = format(subDays(new Date(), i), 'MMM dd');
      last7DaysMap.set(dateLabel, 0);
    }

    // Fill counts
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

    // 3. Format ByStatus and BySource for the frontend charts
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