import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AgentContractStatus } from '@prisma/client';
import type { Response } from 'express';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../auth/roles.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ContractsService } from './contracts.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import {
  RejectContractDto,
  SignContractDto,
  UpdateContractContentDto,
} from './dto/sign-contract.dto';

@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('my-contract')
  @Roles(Role.Agent, Role.Admin, Role.SuperAdmin)
  getMyContract(@GetUser() user: any) {
    return this.contractsService.getMyContract(user);
  }

  @Get('template')
  getTemplate() {
    return this.contractsService.getTemplate();
  }

  @Get()
  @Roles(Role.Admin, Role.SuperAdmin)
  list(
    @Query('status') status?: AgentContractStatus,
    @Query('agent_id') agentId?: string,
  ) {
    return this.contractsService.list(status, agentId);
  }

  @Post()
  @Roles(Role.Admin, Role.SuperAdmin)
  create(@Body() dto: CreateTemplateDto) {
    return this.contractsService.create(dto);
  }

  @Patch(':id/content')
  @Roles(Role.Admin, Role.SuperAdmin)
  updateContent(@Param('id') id: string, @Body() dto: UpdateContractContentDto) {
    return this.contractsService.updateContent(id, dto);
  }

  @Patch(':id/sign')
  @Roles(Role.Agent, Role.Admin, Role.SuperAdmin)
  sign(@Param('id') id: string, @Body() dto: SignContractDto, @GetUser() user: any) {
    return this.contractsService.sign(id, dto, user);
  }

  @Patch(':id/approve')
  @Roles(Role.Admin, Role.SuperAdmin)
  approve(@Param('id') id: string, @GetUser() user: any) {
    return this.contractsService.approve(id, user);
  }

  @Patch(':id/reject')
  @Roles(Role.Admin, Role.SuperAdmin)
  reject(@Param('id') id: string, @Body() dto: RejectContractDto) {
    return this.contractsService.reject(id, dto);
  }

  @Get(':id/download')
  async downloadPdf(
    @Param('id') id: string,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    const data = await this.contractsService.downloadPdf(id, user);
    res.setHeader('Content-Type', data.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`);
    res.send(data.buffer);
  }
}
