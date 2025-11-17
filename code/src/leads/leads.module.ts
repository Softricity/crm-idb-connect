import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { PrismaService } from '../prisma/prisma.service';
@Module({
  imports: [],
  controllers: [LeadsController],
  providers: [LeadsService, PrismaService],
})
export class LeadsModule {}