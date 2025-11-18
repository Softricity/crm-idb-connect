// src/offline-payments/dto/create-offline-payment.dto.ts
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateOfflinePaymentDto {
  @IsOptional()
  @IsString()
  payment_mode?: string;

  @IsString()
  currency: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsString()
  payment_type: string;

  @IsOptional()
  @IsString()
  reference_id?: string;

  @IsOptional()
  @IsString()
  receiver?: string; // partner id

  @IsOptional()
  @IsString()
  lead_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  file?: string;
}
