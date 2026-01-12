import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, Delete } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RolesGuard } from '../auth/roles.guard';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  // PUBLIC: Agent Registration
  @Public() 
  @Post('onboard')
  async onboard(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.onboard(createAgentDto);
  }

  // PROTECTED: Admin List View
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin) // ✅ Explicitly allowed both
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

  // PROTECTED: Approve/Reject
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string, 
    @Body() body: { status: 'APPROVED' | 'REJECTED', reason?: string }
  ) {
    return this.agentsService.updateStatus(id, body.status, body.reason);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  async remove(@Param('id') id: string) {
    return this.agentsService.remove(id);
  }
}