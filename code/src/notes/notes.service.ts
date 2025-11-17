// src/notes/notes.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Role } from '../auth/roles.enum';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(createNoteDto: CreateNoteDto, userId: string) {
    const { lead_id, text } = createNoteDto;
    
    // Check if the lead exists
    const lead = await this.prisma.leads.findUnique({ where: { id: lead_id } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${lead_id} not found.`);
    }

    const note = await this.prisma.notes.create({
      data: {
        text,
        lead_id,
        created_by: userId,
      },
    });

    return note;
  }

  async findAllForLead(leadId: string) {
    // Find all notes for a specific lead
    // and include the name of the partner who created it
    return this.prisma.notes.findMany({
      where: { lead_id: leadId },
      include: {
        partners: {
          select: { name: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async update(id: string, updateNoteDto: UpdateNoteDto, user: any) {
    const note = await this.findNoteOrThrow(id);

    // SECURITY CHECK: Allow if user is admin or the original creator
    if (user.role !== Role.Admin && note.created_by !== user.id) {
      throw new ForbiddenException('You do not have permission to edit this note.');
    }

    return this.prisma.notes.update({
      where: { id },
      data: {
        text: updateNoteDto.text,
      },
    });
  }

  async remove(id: string, user: any) {
    const note = await this.findNoteOrThrow(id);

    // SECURITY CHECK: Allow if user is admin or the original creator
    if (user.role !== Role.Admin && note.created_by !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this note.');
    }

    await this.prisma.notes.delete({
      where: { id },
    });

    return { message: `Note with ID ${id} deleted successfully.` };
  }

  // Helper function to find a note or throw a 404
  private async findNoteOrThrow(id: string) {
    const note = await this.prisma.notes.findUnique({
      where: { id },
    });
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found.`);
    }
    return note;
  }
}