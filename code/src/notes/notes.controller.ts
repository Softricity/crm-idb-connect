// src/notes/notes.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards, // <-- Import
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { GetUser } from '../auth/get-user.decorator'; // <-- Import our helper
import { Role } from '../auth/roles.enum';
import { Roles } from '../auth/roles.decorator';

// Note: The global JwtAuthGuard already protects all these routes.
// We are adding RolesGuard for specific endpoints.

@Controller()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  /**
   * Create a new note for a lead
   * POST /notes
   */
  @Post('notes')
  create(@Body() createNoteDto: CreateNoteDto, @GetUser() user: any) {
    // user.id comes from the JWT payload
    return this.notesService.create(createNoteDto, user.id);
  }

  /**
   * Get all notes for a specific lead
   * GET /leads/:leadId/notes
   */
  @Get('leads/:leadId/notes')
  findAllForLead(@Param('leadId') leadId: string) {
    return this.notesService.findAllForLead(leadId);
  }

  /**
   * Update a specific note
   * PATCH /notes/:id
   */
  @Patch('notes/:id')
  update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @GetUser() user: any,
  ) {
    return this.notesService.update(id, updateNoteDto, user);
  }

  /**
   * Delete a specific note
   * DELETE /notes/:id
   */
  @Delete('notes/:id')
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.notesService.remove(id, user);
  }
}