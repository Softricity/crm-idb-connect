import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export enum IntegrationProviderInput {
  RAZORPAY = 'RAZORPAY',
  GOOGLE_ADS = 'GOOGLE_ADS',
  META_PIXEL = 'META_PIXEL',
  MAILSUITE = 'MAILSUITE',
  SENDER = 'SENDER',
  BREVO = 'BREVO',
}

export class CreateIntegrationDto {
  @IsEnum(IntegrationProviderInput)
  provider: IntegrationProviderInput;

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
