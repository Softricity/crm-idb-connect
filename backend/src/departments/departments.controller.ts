import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateDepartmentOrderDto } from './dto/update-department-order.dto';
import { UpsertDepartmentStatusesDto } from './dto/upsert-department-statuses.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    const includeInactiveFlag = includeInactive === 'true' || includeInactive === '1';
    return this.departmentsService.findAll(includeInactiveFlag);
  }

  @Put('order')
  @Roles(Role.Admin, Role.SuperAdmin)
  updateOrder(@Body() dto: UpdateDepartmentOrderDto) {
    return this.departmentsService.updateOrder(dto);
  }

  @Post()
  @Roles(Role.Admin, Role.SuperAdmin)
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Get(':id/statuses')
  getStatuses(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const includeInactiveFlag = includeInactive === 'true' || includeInactive === '1';
    return this.departmentsService.getStatuses(id, includeInactiveFlag);
  }

  @Put(':id/statuses')
  @Roles(Role.Admin, Role.SuperAdmin)
  upsertStatuses(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertDepartmentStatusesDto,
  ) {
    return this.departmentsService.upsertStatuses(id, dto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const includeInactiveFlag = includeInactive === 'true' || includeInactive === '1';
    return this.departmentsService.findOne(id, includeInactiveFlag);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, dto);
  }
}
