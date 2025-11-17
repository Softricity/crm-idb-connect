// src/partners/partners.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards
} from '@nestjs/common';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RolesGuard } from '../auth/roles.guard';
import { BulkDeletePartnerDto } from './dto/bulk-delete.dto';

@UseGuards(RolesGuard)
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  // POST /partners
  @Post()
  @Roles(Role.Admin) // Only Admins can create partners
  create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnersService.create(createPartnerDto);
  }

  // GET /partners
  // GET /partners?role=agent
  // GET /partners?role=counsellor
  @Get()
  @Roles(Role.Admin, Role.Counsellor)
  findAll(@Query('role') role?: 'agent' | 'counsellor' | 'admin') {
    return this.partnersService.findAll(role);
  }

  // GET /partners/:id
  @Get(':id')
  @Roles(Role.Admin, Role.Counsellor)
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }

  // PATCH /partners/:id
  @Patch(':id')
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() updatePartnerDto: UpdatePartnerDto) {
    return this.partnersService.update(id, updatePartnerDto);
  }

  // DELETE /partners/:id
  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.partnersService.remove(id);
  }

  @Post('bulk/delete')
  @Roles(Role.Admin) // 🔒 Strict Admin Only
  bulkRemove(@Body() bulkDeletePartnerDto: BulkDeletePartnerDto) {
    return this.partnersService.bulkRemove(bulkDeletePartnerDto);
  }
}