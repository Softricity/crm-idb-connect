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
  constructor(private readonly leadsService: LeadsService) { }
  
  @Public()
  @Post()
  async create(@Body() createLeadDto: CreateLeadDto, @GetUser() user?: any) {
    return this.leadsService.create(createLeadDto, user);
  }
  
  @Get('my-applications')
  findMyApplications(@Query('created_by') createdBy?: string) {
    return this.leadsService.findMyApplications(createdBy);
  }
  
  @Get()
  findAll(
    @GetUser() user: any,
    @Query('assigned_to') assignedTo?: string,
    @Query('created_by') createdBy?: string,
    @Query('type') type?: string,
    @Query('branch_id') branchId?: string,
    @Query('email') email?: string,
    @Query('source') source?: string,
  ) {
    return this.leadsService.findAll(user, assignedTo, createdBy, type, branchId, email, source);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }
  
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLeadDto: Partial<CreateLeadDto>,
    @GetUser() user: any,
  ) {
    return this.leadsService.update(id, updateLeadDto, user);
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

  @Post(':id/courses')
  async addCourseToLead(
    @Param('id') leadId: string,
    @Body('courseId') courseId: string,
    @GetUser() user?: any
  ) {
    return this.leadsService.addCourseToLead(leadId, courseId, user);
  }
  
  @Delete(':id/courses/:courseId')
  async removeCourseFromLead(
    @Param('id') leadId: string,
    @Param('courseId') courseId: string,
    @GetUser() user?: any
  ) {
    return this.leadsService.removeCourseFromLead(leadId, courseId, user);
  }

  @Patch(':id/assign-team-member')
  @Roles(Role.Agent)
  async assignTeamMember(
    @Param('id') leadId: string,
    @Body('teamMemberId') teamMemberId: string,
    @GetUser() user: any,
  ) {
    return this.leadsService.assignTeamMember(leadId, teamMemberId, user);
  }
}
