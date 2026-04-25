import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RolesGuard } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  SetCategoryAccessDto, 
  AssignAgentCategoryDto 
} from './dto/category.dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  // --- Categories ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Get('categories')
  async findAllCategories() {
    return this.agentsService.findAllCategories();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Get('categories/:id')
  async findOneCategory(@Param('id') id: string) {
    return this.agentsService.findOneCategory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.agentsService.createCategory(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.agentsService.updateCategory(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Delete('categories/:id')
  async removeCategory(@Param('id') id: string) {
    return this.agentsService.removeCategory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Get('categories/:id/universities')
  async getCategoryAccess(@Param('id') id: string) {
    return this.agentsService.getCategoryAccess(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Put('categories/:id/universities')
  async setCategoryAccess(@Param('id') id: string, @Body() dto: SetCategoryAccessDto) {
    return this.agentsService.setCategoryAccess(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Patch(':id/category')
  async assignCategory(@Param('id') id: string, @Body() dto: AssignAgentCategoryDto) {
    return this.agentsService.assignCategory(id, dto.category_id);
  }

  // --- Inquiries ---

  @Public()
  @Post('inquiry')
  async createInquiry(@Body() body: any) {
    return this.agentsService.createInquiry(body);
  }

  @Public()
  @Post('inquiry/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } })) // 10MB limit
  async uploadInquiryFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    return this.agentsService.uploadInquiryDocument(file, req);
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
  async updateInquiryStatus(
    @Param('id') id: string,
    @Body() body: { status: any; branch_id?: string; category_id?: string },
  ) {
    return this.agentsService.updateInquiryStatus(id, body.status, body.branch_id, body.category_id);
  }

  // --- Agents ---

  @Public()
  @Post('onboard')
  async onboard(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.onboard(createAgentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Get()
  async findAll(@Query('status') status?: any) {
    return this.agentsService.findAll(status);
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.updateAgent(id, dto);
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  async remove(@Param('id') id: string) {
    return this.agentsService.remove(id);
  }
}
