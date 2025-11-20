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
  UseGuards,
  Request,
  ForbiddenException
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

  // GET /partners/me - Get current user's profile
  @Get('me')
  async getCurrentUser(@Request() req) {
    return this.partnersService.findOne(req.user.id);
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
  async findOne(@Param('id') id: string, @Request() req) {
    // Users can access their own data, or Admin/Counsellor can access any partner's data
    if (req.user.id !== id && req.user.role !== Role.Admin && req.user.role !== Role.Counsellor) {
      throw new ForbiddenException('You can only access your own profile');
    }
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