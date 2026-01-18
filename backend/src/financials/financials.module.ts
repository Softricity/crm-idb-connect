import { Module } from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FinancialsController } from './financials.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FinancialsController],
  providers: [FinancialsService],
  exports: [FinancialsService], // Exporting if other modules need it later
})
export class FinancialsModule {}