import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class UpdateOptionDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
