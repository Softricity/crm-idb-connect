import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentContractStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../storage/supabase.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import {
  RejectContractDto,
  SignContractDto,
  UpdateContractContentDto,
} from './dto/sign-contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  private resolveAgentIdFromUser(user: any): string {
    if (user?.type === 'agent_team_member' && user?.parent_agent_id) {
      return user.parent_agent_id;
    }
    return user?.id || user?.userId || user?.sub;
  }

  private ensureContractHtml(content: string, signatureUrl?: string): string {
    const signatureTag = signatureUrl
      ? `<div style="margin-top:16px;"><img src="${signatureUrl}" alt="Signature" style="max-height:120px;max-width:300px;" /></div>`
      : '<div style="margin-top:16px;">________________________</div>';
    if (content.includes('<!-- SIGNATURE_PLACEHOLDER -->')) {
      return content.replace('<!-- SIGNATURE_PLACEHOLDER -->', signatureTag);
    }
    return `${content}<hr/><h4>Signature</h4>${signatureTag}`;
  }

  private toPdfBuffer(text: string): Buffer {
    // Minimal single-page PDF fallback without external runtime deps.
    const escaped = text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\r?\n/g, ' ');
    const stream = `BT /F1 11 Tf 40 760 Td (${escaped.slice(0, 3000)}) Tj ET`;
    const body = [
      '%PDF-1.4',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
      `4 0 obj << /Length ${stream.length} >> stream ${stream} endstream endobj`,
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    ].join('\n');
    const xrefStart = body.length + 1;
    const xref = `xref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000263 00000 n \n0000000366 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return Buffer.from(`${body}\n${xref}`, 'utf-8');
  }

  async create(dto: CreateTemplateDto) {
    return this.prisma.agentContract.create({
      data: {
        agent_id: dto.agent_id,
        title: dto.title,
        content: dto.content,
      },
      include: { agent: true },
    });
  }

  async list(status?: AgentContractStatus, agentId?: string) {
    const where: Prisma.AgentContractWhereInput = {};
    if (status) where.status = status;
    if (agentId) where.agent_id = agentId;
    return this.prisma.agentContract.findMany({
      where,
      include: { agent: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async getMyContract(user: any) {
    const agentId = this.resolveAgentIdFromUser(user);
    if (!agentId) throw new BadRequestException('Unable to resolve agent');
    const contract = await this.prisma.agentContract.findFirst({
      where: { agent_id: agentId },
      orderBy: { created_at: 'desc' },
    });
    if (!contract) throw new NotFoundException('No contract found');
    return contract;
  }

  async updateContent(id: string, dto: UpdateContractContentDto) {
    const existing = await this.prisma.agentContract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Contract not found');
    return this.prisma.agentContract.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        content: dto.content ?? existing.content,
      },
    });
  }

  async sign(id: string, dto: SignContractDto, user: any) {
    const agentId = this.resolveAgentIdFromUser(user);
    const contract = await this.prisma.agentContract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.agent_id !== agentId) {
      throw new BadRequestException('You can only sign your own contract');
    }
    return this.prisma.agentContract.update({
      where: { id },
      data: {
        signature_url: dto.signature_url,
        is_signed: true,
        signed_at: new Date(),
        status: AgentContractStatus.SIGNED,
        rejection_note: null,
      },
    });
  }

  async uploadSignature(id: string, file: Express.Multer.File | undefined, user: any) {
    if (!file) throw new BadRequestException('Signature file is required');
    const agentId = this.resolveAgentIdFromUser(user);
    const contract = await this.prisma.agentContract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.agent_id !== agentId) {
      throw new BadRequestException('You can only upload signature for your own contract');
    }

    const signatureUrl = await this.supabaseService.uploadFile(
      file,
      `contracts/${contract.agent_id}`,
      'idb-student-documents',
    );

    return { signature_url: signatureUrl };
  }

  async approve(id: string, user: any) {
    const contract = await this.prisma.agentContract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (!contract.is_signed) throw new BadRequestException('Contract is not signed');

    await this.prisma.$transaction([
      this.prisma.agentContract.update({
        where: { id },
        data: {
          status: AgentContractStatus.APPROVED,
          approved_by: user?.id || user?.userId || null,
          approved_at: new Date(),
          rejection_note: null,
        },
      }),
      this.prisma.agent.update({
        where: { id: contract.agent_id },
        data: { contract_approved: true },
      }),
    ]);
    return { success: true };
  }

  async reject(id: string, dto: RejectContractDto) {
    const contract = await this.prisma.agentContract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    await this.prisma.$transaction([
      this.prisma.agentContract.update({
        where: { id },
        data: {
          status: AgentContractStatus.REJECTED,
          rejection_note: dto.rejection_note || null,
          approved_at: null,
          approved_by: null,
        },
      }),
      this.prisma.agent.update({
        where: { id: contract.agent_id },
        data: { contract_approved: false },
      }),
    ]);
    return { success: true };
  }

  async downloadPdf(id: string, user: any) {
    const contract = await this.prisma.agentContract.findUnique({
      where: { id },
      include: { agent: true },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const role = user?.role?.toLowerCase?.();
    const canAdmin = role === 'admin' || role === 'super admin';
    const agentId = this.resolveAgentIdFromUser(user);
    if (!canAdmin && agentId !== contract.agent_id) {
      throw new BadRequestException('Unauthorized contract access');
    }

    const html = this.ensureContractHtml(contract.content, contract.signature_url || undefined);
    const pdf = this.toPdfBuffer(
      `${contract.title}\n\nAgent: ${contract.agent?.name || contract.agent_id}\nStatus: ${contract.status}\n\n${html.replace(/<[^>]+>/g, ' ')}`
    );
    return {
      filename: `contract-${contract.id}.pdf`,
      mimeType: 'application/pdf',
      buffer: pdf,
    };
  }

  async getTemplate() {
    const latest = await this.prisma.agentContract.findFirst({
      orderBy: { created_at: 'desc' },
    });
    return latest || null;
  }
}
