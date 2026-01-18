import { Controller, Get, Patch, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { UpdateFinancialStatusDto } from './dto/update-financial-status.dto';
import { CreateFinancialNoteDto } from './dto/create-financial-note.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('financials')
@UseGuards(JwtAuthGuard)
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  // GET /financials/:leadId
  @Get(':leadId')
  getFinancials(@Param('leadId') leadId: string) {
    return this.financialsService.getFinancials(leadId);
  }

  // PATCH /financials/:leadId/status
  @Patch(':leadId/status')
  updateStatus(
    @Param('leadId') leadId: string,
    @Body() dto: UpdateFinancialStatusDto
  ) {
    return this.financialsService.updateStatus(leadId, dto);
  }

  // POST /financials/:leadId/notes
  @Post(':leadId/notes')
  addNote(
    @Param('leadId') leadId: string,
    @GetUser() user: any,
    @Body() dto: CreateFinancialNoteDto
  ) {
    return this.financialsService.addNote(leadId, user.id, dto);
  }

  @Delete('notes/:noteId')
  deleteNote(@Param('noteId') noteId: string) {
    return this.financialsService.deleteNote(noteId);
  }
}