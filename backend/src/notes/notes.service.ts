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
import { TimelineService } from '../timeline/timeline.service';
import { getScope, resolveUserDepartmentCodes } from '../common/utils/scope.util';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private timelineService: TimelineService,
  ) {}

  async create(createNoteDto: CreateNoteDto, user: any) {
    const { lead_id, text } = createNoteDto;

    // 1. Security Check: Can this user access this lead?
    const deptCodes = await resolveUserDepartmentCodes(user, this.prisma);
    const scope = getScope(user, deptCodes);
    const lead = await this.prisma.leads.findFirst({ 
      where: { 
        id: lead_id,
        ...scope
      } 
    });

    if (!lead) {
      throw new NotFoundException(`Lead not found or you do not have access.`);
    }

    // 2. Create Note
    const note = await this.prisma.notes.create({
      data: {
        text,
        lead_id,
        created_by: user.id,
      },
    });

    await this.timelineService.logNoteAdded(note, user.id);

    return note;
  }

  async findAllForLead(leadId: string, user: any) {
    // 1. Security Check
    const deptCodes = await resolveUserDepartmentCodes(user, this.prisma);
    const scope = getScope(user, deptCodes);
    const lead = await this.prisma.leads.findFirst({ 
      where: { 
        id: leadId,
        ...scope // <--- Apply Branch Filter
      } 
    });

    if (!lead) {
      throw new NotFoundException(`Lead not found or you do not have access.`);
    }

    // 2. Fetch Notes
    return this.prisma.notes.findMany({
      where: { lead_id: leadId },
      include: {
        partners: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async update(id: string, updateNoteDto: UpdateNoteDto, user: any) {
    const note = await this.findNoteOrThrow(id);

    if (user.role !== Role.Admin && note.created_by !== user.id) {
      throw new ForbiddenException('You do not have permission to edit this note.');
    }

    return this.prisma.notes.update({
      where: { id },
      data: { text: updateNoteDto.text },
    });
  }

  async remove(id: string, user: any) {
    const note = await this.findNoteOrThrow(id);

    if (user.role !== Role.Admin && note.created_by !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this note.');
    }

    await this.prisma.notes.delete({ where: { id } });
    return { message: `Note with ID ${id} deleted successfully.` };
  }

  private async findNoteOrThrow(id: string) {
    const note = await this.prisma.notes.findUnique({ where: { id } });
    if (!note) throw new NotFoundException(`Note with ID ${id} not found.`);
    return note;
  }
}