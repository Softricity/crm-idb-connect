import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class DepartmentStatusItemDto {
  @IsString()
  @MaxLength(80)
  key: string;

  @IsString()
  @MaxLength(120)
  label: string;

  @IsInt()
  @Min(0)
  order_index: number;

  @IsOptional()
  @IsBoolean()
  is_terminal?: boolean;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpsertDepartmentStatusesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DepartmentStatusItemDto)
  statuses: DepartmentStatusItemDto[];
}
