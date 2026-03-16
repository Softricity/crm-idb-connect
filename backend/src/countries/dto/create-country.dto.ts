import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  flag?: string; // URL
}