import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SignContractDto {
  @IsString()
  @IsNotEmpty()
  signature_url: string;
}

export class UpdateContractContentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;
}

export class RejectContractDto {
  @IsString()
  @IsOptional()
  rejection_note?: string;
}
