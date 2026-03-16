import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { GetUser } from '../auth/get-user.decorator';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':type')
  async getReportData(
    @Param('type') type: string,
    @Query() query: ReportQueryDto,
    @Query() rawQuery: Record<string, any>,
    @GetUser() user: any,
  ) {
    return this.reportsService.getReportData(type, query, rawQuery, user);
  }

  @Get(':type/filters')
  async getFilterOptions(
    @Param('type') type: string,
    @Query() query: ReportQueryDto,
    @GetUser() user: any,
  ) {
    return this.reportsService.getFilterOptions(type, query, user);
  }

  @Get(':type/export')
  async exportReport(
    @Param('type') type: string,
    @Query() query: ReportQueryDto,
    @Query() rawQuery: Record<string, any>,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.reportsService.exportReport(type, query, rawQuery, user);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
