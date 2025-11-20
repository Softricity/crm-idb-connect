import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query, // <-- For query parameters
} from '@nestjs/common';
import { LeadsService } from './leads.service';
// ✅ 1. Import new DTOs
import {
  BulkAssignDto,
  BulkStatusDto,
  BulkMessageDto,
} from './dto/bulk-update.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Public } from '../auth/public.decorator';
import { GetUser } from '../auth/get-user.decorator'; // <-- Import GetUser
import { Roles } from '../auth/roles.decorator'; // <-- Import Roles
import { Role } from '../auth/roles.enum'; // <-- Import Role
import { RolesGuard } from '../auth/roles.guard';
import { BulkDeleteDto } from './dto/bulk-update.dto';

@UseGuards(RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // Public & Internal Lead Creation
  // POST /leads
  @Public()
  @Post()
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  // Get All Leads
  // GET /leads?assigned_to=userId&created_by=userId&type=lead
  @Get()
  findAll(
    @Query('assigned_to') assignedTo?: string,
    @Query('created_by') createdBy?: string,
    @Query('type') type?: string,
  ) {
    return this.leadsService.findAll(assignedTo, createdBy, type);
  }  

  // Get Single Lead
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  // Update Lead
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeadDto: Partial<CreateLeadDto>) {
    return this.leadsService.update(id, updateLeadDto);
  }

  @Post('bulk/assign')
  @Roles(Role.Admin) // Only Admins can bulk assign
  bulkAssign(@Body() bulkAssignDto: BulkAssignDto, @GetUser() user: any) {
    return this.leadsService.bulkAssign(bulkAssignDto, user);
  }

  /**
   * Bulk update status of leads
   * POST /leads/bulk/status
   */
  @Post('bulk/status')
  @Roles(Role.Admin) // Only Admins can bulk update status
  bulkUpdateStatus(@Body() bulkStatusDto: BulkStatusDto, @GetUser() user: any) {
    return this.leadsService.bulkUpdateStatus(bulkStatusDto, user);
  }

  /**
   * Bulk send message to leads
   * POST /leads/bulk/message
   */
  @Post('bulk/message')
  @Roles(Role.Admin) // Only Admins can bulk message
  bulkSendMessage(@Body() bulkMessageDto: BulkMessageDto, @GetUser() user: any) {
    return this.leadsService.bulkSendMessage(bulkMessageDto, user);
  }

  @Delete(':id')
  @Roles(Role.Admin) // 🔒 Only Admins can delete leads
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }
  
  @Post('bulk/delete')
  @Roles(Role.Admin) // 🔒 Strict Admin Only
  bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.leadsService.bulkDelete(bulkDeleteDto);
  }
}
