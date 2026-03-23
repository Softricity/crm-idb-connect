import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentContractStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../storage/supabase.service';
import { promises as fs } from 'fs';
import * as path from 'path';
import PDFDocument = require('pdfkit');
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

  private stripHtml(input: string): string {
    return input
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
      .replace(/<li>/gi, '- ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private async resolveSignatureBuffer(signatureUrl?: string | null): Promise<Buffer | null> {
    if (!signatureUrl) return null;

    try {
      if (signatureUrl.startsWith('data:')) {
        const commaIndex = signatureUrl.indexOf(',');
        if (commaIndex === -1) return null;
        const payload = signatureUrl.slice(commaIndex + 1);
        return Buffer.from(payload, 'base64');
      }

      const extractLocalUploadPath = (urlOrPath: string): string | null => {
        if (urlOrPath.startsWith('/uploads/')) {
          return path.join(process.cwd(), urlOrPath.slice(1));
        }
        if (urlOrPath.startsWith('uploads/')) {
          return path.join(process.cwd(), urlOrPath);
        }
        if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
          try {
            const pathname = new URL(urlOrPath).pathname;
            if (pathname.startsWith('/uploads/')) {
              return path.join(process.cwd(), pathname.slice(1));
            }
          } catch {
            return null;
          }
        }
        return null;
      };

      const localPath = extractLocalUploadPath(signatureUrl);
      if (localPath) {
        const stat = await fs.stat(localPath);
        if (stat.isFile()) {
          return fs.readFile(localPath);
        }
      }

      if (signatureUrl.startsWith('http://') || signatureUrl.startsWith('https://')) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(signatureUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('pdf')) return null;
        const bytes = await res.arrayBuffer();
        return Buffer.from(bytes);
      }
    } catch {
      return null;
    }

    return null;
  }

  private async toPdfBuffer(contract: {
    title: string;
    status: string;
    content: string;
    signature_url?: string | null;
    agentName: string;
  }): Promise<Buffer> {
    const signatureBuffer = await this.resolveSignatureBuffer(contract.signature_url);

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('error', reject);
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).text(contract.title, { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#555555').text(`Agent: ${contract.agentName}`);
      doc.text(`Status: ${contract.status}`);
      doc.moveDown();

      doc.fillColor('#000000').fontSize(11);
      doc.text(this.stripHtml(contract.content), { align: 'left' });

      doc.moveDown(1.5);
      doc.fontSize(12).text('Signature');
      doc.moveDown(0.5);

      if (signatureBuffer) {
        try {
          doc.image(signatureBuffer, { fit: [220, 120] });
        } catch {
          doc.fontSize(10).fillColor('#666666').text('Signature file attached but could not be rendered as image.');
        }
      } else if (contract.signature_url) {
        doc.fontSize(10).fillColor('#666666').text(`Signature URL: ${contract.signature_url}`);
      } else {
        doc.fontSize(10).fillColor('#666666').text('No signature available.');
      }

      doc.end();
    });
  }

  async create(dto: CreateTemplateDto) {
    return this.prisma.agentContract.create({
      data: {
        agent_id: dto.agent_id ?? null,
        title: dto.title,
        content: dto.content,
      },
      include: { agent: true },
    } as any);
  }

  async bulkAssign(id: string, agentIds: string[]) {
    const template = await this.prisma.agentContract.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('Template not found');

    const creations = agentIds.map((agentId) =>
      this.prisma.agentContract.create({
        data: {
          agent_id: agentId,
          title: template.title,
          content: template.content,
          status: AgentContractStatus.PENDING,
        },
      }),
    );

    return this.prisma.$transaction(creations);
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

    let signatureUrl: string;
    try {
      const bucket = process.env.SUPABASE_BUCKET || 'idb-student-documents';
      signatureUrl = await this.supabaseService.uploadFile(
        file,
        `contracts/${contract.agent_id}`,
        bucket,
      );
    } catch {
      // Fallback keeps signing flow working even if storage/env is misconfigured.
      const uploadsDir = path.join(process.cwd(), 'uploads', 'contracts', contract.agent_id);
      await fs.mkdir(uploadsDir, { recursive: true });
      const safeName = `${Date.now()}-${(file.originalname || 'signature').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const fullPath = path.join(uploadsDir, safeName);
      await fs.writeFile(fullPath, file.buffer);
      const baseUrl = process.env.API_BASE_URL || process.env.BACKEND_PUBLIC_URL || 'http://localhost:5005';
      signatureUrl = `${baseUrl}/uploads/contracts/${contract.agent_id}/${safeName}`;
    }
    const updated = await this.prisma.agentContract.update({
      where: { id },
      data: {
        signature_url: signatureUrl,
        is_signed: true,
        signed_at: new Date(),
        status: AgentContractStatus.SIGNED,
        rejection_note: null,
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      signature_url: updated.signature_url,
    };
  }

  async approve(id: string, user: any) {
    const contract = await this.prisma.agentContract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (!contract.is_signed) throw new BadRequestException('Contract is not signed');

    const updates: any[] = [
      this.prisma.agentContract.update({
        where: { id },
        data: {
          status: AgentContractStatus.APPROVED,
          approved_by: user?.id || user?.userId || null,
          approved_at: new Date(),
          rejection_note: null,
        },
      }),
    ];

    if (contract.agent_id) {
      updates.push(
        this.prisma.agent.update({
          where: { id: contract.agent_id },
          data: { contract_approved: true },
        }),
      );
    }

    await this.prisma.$transaction(updates);
    return { success: true };
  }

  async reject(id: string, dto: RejectContractDto) {
    const contract = await this.prisma.agentContract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');

    const updates: any[] = [
      this.prisma.agentContract.update({
        where: { id },
        data: {
          status: AgentContractStatus.REJECTED,
          rejection_note: dto.rejection_note || null,
          approved_at: null,
          approved_by: null,
        },
      }),
    ];

    if (contract.agent_id) {
      updates.push(
        this.prisma.agent.update({
          where: { id: contract.agent_id },
          data: { contract_approved: false },
        }),
      );
    }

    await this.prisma.$transaction(updates);
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

    const pdf = await this.toPdfBuffer({
      title: contract.title,
      status: contract.status,
      content: contract.content,
      signature_url: contract.signature_url,
      agentName: contract.agent?.name || contract.agent_id || 'General Template',
    });
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
