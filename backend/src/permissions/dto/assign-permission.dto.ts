import { IsUUID, IsArray } from 'class-validator';

export class AssignPermissionsDto {
  @IsUUID()
  role_id: string;

  @IsArray()
  @IsUUID('4', { each: true })
  permission_ids: string[];
}
