import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';

export class DepartmentOrderItemDto {
  @IsUUID()
  department_id: string;

  @IsInt()
  @Min(0)
  order_index: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class UpdateDepartmentOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DepartmentOrderItemDto)
  items: DepartmentOrderItemDto[];
}
