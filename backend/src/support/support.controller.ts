import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  create(@GetUser() user: any, @Body() dto: CreateTicketDto) {
    return this.supportService.create(user, dto);
  }

  @Get()
  findAll(@GetUser() user: any, @Query('status') status?: string) {
    return this.supportService.findAll(user, status);
  }

  @Get(':id')
  findOne(@GetUser() user: any, @Param('id') id: string) {
    return this.supportService.findOne(user, id);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body() dto: AddCommentDto
  ) {
    return this.supportService.addComment(user, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.supportService.updateStatus(user, id, dto);
  }
}
