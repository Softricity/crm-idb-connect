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

  // 1. Create Ticket
  @Post()
  create(@GetUser() user: any, @Body() dto: CreateTicketDto) {
    return this.supportService.create(user.id, dto);
  }

  // 2. Get All Tickets (Filter by my own ID if I'm an agent)
  @Get()
  findAll(@GetUser() user: any, @Query('status') status?: string) {
    // If user is Admin, they can see all. If Partner, only their own.
    // Assuming user.role === 'admin' check logic here:
    const partnerId = user.role === 'agent' || user.role === 'partner' ? user.id : undefined;
    
    return this.supportService.findAll(partnerId, status);
  }

  // 3. Get Single Ticket
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supportService.findOne(id);
  }

  // 4. Add Reply/Comment
  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body() dto: AddCommentDto
  ) {
    const userType = user.role === 'admin' || user.role === 'super_admin' ? 'ADMIN' : 'PARTNER';
    return this.supportService.addComment(id, user.id, userType, user.name, dto);
  }

  // 5. Update Status (Admin/Staff only ideally, or Agent closing their own ticket)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.supportService.updateStatus(id, dto);
  }
}