import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RolesGuard } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Public()
  @Post('onboard')
  async onboard(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.onboard(createAgentDto);
  }

  @Public()
  @Post('inquiry')
  async createInquiry(@Body() body: any) {
    return this.agentsService.createInquiry(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Get('inquiries')
  async getInquiries(@Query('status') status?: any) {
    return this.agentsService.getInquiries(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Patch('inquiries/:id/status')
  async updateInquiryStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.agentsService.updateInquiryStatus(id, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Get()
  async findAll(@Query('status') status?: any) {
    return this.agentsService.findAll(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; reason?: string },
  ) {
    return this.agentsService.updateStatus(id, body.status, body.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Put(':id/universities')
  async setUniversityAccess(@Param('id') id: string, @Body('universityIds') universityIds: string[]) {
    return this.agentsService.setUniversityAccess(id, universityIds || []);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Get(':id/universities')
  async getUniversityAccess(@Param('id') id: string) {
    return this.agentsService.getUniversityAccess(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Agent)
  @Get('my/team')
  async getMyTeam(@GetUser() user: any) {
    return this.agentsService.getMyTeam(user.id || user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Agent)
  @Post('my/team')
  async createTeamMember(@GetUser() user: any, @Body() body: any) {
    return this.agentsService.createTeamMember(user.id || user.userId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Agent)
  @Patch('my/team/:id')
  async updateTeamMember(@GetUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.agentsService.updateTeamMember(user.id || user.userId, id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Agent)
  @Delete('my/team/:id')
  async deleteTeamMember(@GetUser() user: any, @Param('id') id: string) {
    return this.agentsService.deleteTeamMember(user.id || user.userId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Agent)
  @Patch('leads/:leadId/assign-team-member')
  async assignLeadToTeamMember(
    @GetUser() user: any,
    @Param('leadId') leadId: string,
    @Body('teamMemberId') teamMemberId: string,
  ) {
    return this.agentsService.assignLeadToTeamMember(user.id || user.userId, leadId, teamMemberId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  async remove(@Param('id') id: string) {
    return this.agentsService.remove(id);
  }
}
