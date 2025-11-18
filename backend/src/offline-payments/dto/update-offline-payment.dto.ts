// src/offline-payments/dto/update-offline-payment.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateOfflinePaymentDto } from './create-offline-payment.dto';

export class UpdateOfflinePaymentDto extends PartialType(CreateOfflinePaymentDto) {}
