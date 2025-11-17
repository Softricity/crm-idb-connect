// src/followups/followups.module.ts
import { Module } from '@nestjs/common';
import { FollowupsService } from './followups.service';
import { FollowupsController } from './followups.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [FollowupsController],
  providers: [FollowupsService, PrismaService],
})
export class FollowupsModule {}