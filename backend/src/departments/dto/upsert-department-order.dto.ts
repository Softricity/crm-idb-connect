import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';

export class DepartmentOrderItemDto {
  @IsUUID()
  department_id: string;

  @IsInt()
  @Min(0)
  order_index: number;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpsertDepartmentOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentOrderItemDto)
  items: DepartmentOrderItemDto[];
}
