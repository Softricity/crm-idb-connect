// src/followups/followups.module.ts
import { Module } from '@nestjs/common';
import { FollowupsService } from './followups.service';
import { FollowupsController } from './followups.controller';

@Module({
  imports: [],
  controllers: [FollowupsController],
  providers: [FollowupsService],
})
export class FollowupsModule {}