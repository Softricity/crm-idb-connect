import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartmentStatusDto } from './create-department-status.dto';

export class UpdateDepartmentStatusDto extends PartialType(CreateDepartmentStatusDto) {}
