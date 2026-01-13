import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import {
  BulkAssignDto,
  BulkStatusDto,
  BulkMessageDto,
} from './dto/bulk-update.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Public } from '../auth/public.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
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
  // Get My Applications
  @Get('my-applications')
  findMyApplications(@Query('created_by') createdBy?: string) {
    return this.leadsService.findMyApplications(createdBy);
  }

  // Get All Leads
  @Get()
  findAll(
    @GetUser() user: any,
    @Query('assigned_to') assignedTo?: string,
    @Query('created_by') createdBy?: string,
    @Query('type') type?: string,
    @Query('branch_id') branchId?: string,
    @Query('email') email?: string,
  ) {
    return this.leadsService.findAll(user, assignedTo, createdBy, type, branchId, email);
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
  @Roles(Role.Admin)
  bulkAssign(@Body() bulkAssignDto: BulkAssignDto, @GetUser() user: any) {
    return this.leadsService.bulkAssign(bulkAssignDto, user);
  }

  @Post('login')
  @Public()
  login(@Body('email') email: string, @Body('password') password: string) {
    return this.leadsService.login(email, password);
  }

  @Post('bulk/status')
  @Roles(Role.Admin)
  bulkUpdateStatus(@Body() bulkStatusDto: BulkStatusDto, @GetUser() user: any) {
    return this.leadsService.bulkUpdateStatus(bulkStatusDto, user);
  }

  @Post('bulk/message')
  @Roles(Role.Admin)
  bulkSendMessage(@Body() bulkMessageDto: BulkMessageDto, @GetUser() user: any) {
    return this.leadsService.bulkSendMessage(bulkMessageDto, user);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }
  
  @Post('bulk/delete')
  @Roles(Role.Admin)
  bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.leadsService.bulkDelete(bulkDeleteDto);
  }
}