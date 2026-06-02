import { ArrayUnique, IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReplaceDepartmentPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @IsOptional()
  permission_ids: string[] = [];
}
