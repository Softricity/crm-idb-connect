import { Module } from '@nestjs/common';
import { DropdownsService } from './dropdowns.service';
import { DropdownsController } from './dropdowns.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DropdownsController],
  providers: [DropdownsService],
  exports: [DropdownsService], // Exporting if other modules need it later
})
export class DropdownsModule {}