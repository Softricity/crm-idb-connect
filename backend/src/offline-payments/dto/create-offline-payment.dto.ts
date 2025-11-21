// src/offline-payments/dto/create-offline-payment.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer'; // Import Type

export class CreateOfflinePaymentDto {
  @IsOptional()
  @IsString()
  payment_mode?: string;

  @IsString()
  currency: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number) // <--- ADD THIS: Converts string "100" to number 100
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

  // 'file' will now be handled by the file interceptor, 
  // but we keep this optional for flexibility
  @IsOptional()
  @IsString()
  file?: string;
}