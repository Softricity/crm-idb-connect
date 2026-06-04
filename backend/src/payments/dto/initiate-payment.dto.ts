import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class InitiatePaymentDto {
  @IsNumber()
  @Min(10)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

