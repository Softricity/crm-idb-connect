// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { LeadsModule } from '../leads/leads.module';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}