import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  permission_group_id?: string;
}
