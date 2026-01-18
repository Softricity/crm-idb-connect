import { IsNotEmpty, IsEnum } from 'class-validator';
import { FinancialStatus } from '@prisma/client';

export class UpdateFinancialStatusDto {
  @IsNotEmpty()
  @IsEnum(FinancialStatus)
  status: FinancialStatus;
}