import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MailService } from './mail.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('mail')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('templates')
  findAllTemplates(@Query('category') category?: string) {
    return this.mailService.findAllTemplates(category);
  }

  @Get('templates/:id')
  findOneTemplate(@Param('id') id: string) {
    return this.mailService.findOneTemplate(id);
  }

  @Post('templates')
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.mailService.createTemplate(dto);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.mailService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  removeTemplate(@Param('id') id: string) {
    return this.mailService.removeTemplate(id);
  }

  @Post('test-connection')
  testConnection(@Body('email') email?: string) {
    return this.mailService.testConnection(email);
  }
}
