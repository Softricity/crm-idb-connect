import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { IntegrationProvider } from '@prisma/client';

export class CreateIntegrationDto {
  @IsEnum(IntegrationProvider)
  provider: IntegrationProvider;

  @IsString()
  display_name: string;

  @IsOptional()
  @IsString()
  api_key?: string;

  @IsOptional()
  @IsString()
  api_secret?: string;

  @IsOptional()
  @IsObject()
  config_json?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

