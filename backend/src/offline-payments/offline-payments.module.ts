// src/offline-payments/offline-payments.module.ts
import { Module } from '@nestjs/common';
import { OfflinePaymentsService } from './offline-payments.service';
import { OfflinePaymentsController } from './offline-payments.controller';

@Module({
  imports: [],
  controllers: [OfflinePaymentsController],
  providers: [OfflinePaymentsService],
})
export class OfflinePaymentsModule {}
