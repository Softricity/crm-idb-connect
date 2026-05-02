import { Module } from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { UniversitiesController } from './universities.controller';
import { PrismaService } from '../prisma/prisma.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [UniversitiesController],
  providers: [UniversitiesService, PrismaService],
})
export class UniversitiesModule {}