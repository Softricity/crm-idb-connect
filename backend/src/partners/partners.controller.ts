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
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // <--- ADDED THIS
import { BulkDeletePartnerDto } from './dto/bulk-delete.dto';

@UseGuards(JwtAuthGuard, RolesGuard) // <--- UPDATED THIS
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  create(@Body() createPartnerDto: CreatePartnerDto, @Request() req) {
    // Pass req.user so the service knows which branch to assign
    return this.partnersService.create(createPartnerDto, req.user);
  }

  @Get()
  findAll(
    @Request() req, 
    @Query('role') role?: string,
    @Query('branch_id') branchId?: string
  ) {
    // Pass req.user so the service filters by branch
    return this.partnersService.findAll(req.user, role, branchId);
  }

  // GET /partners/me - Get current user's profile
  @Get('me')
  async getCurrentUser(@Request() req) {
    return this.partnersService.findOne(req.user.userId); // Ensure usage of userId from JWT strategy
  }

  // GET /partners/:id
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
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