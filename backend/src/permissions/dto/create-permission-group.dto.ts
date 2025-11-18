import { IsString } from 'class-validator';

export class CreatePermissionGroupDto {
  @IsString()
  name: string;
}
