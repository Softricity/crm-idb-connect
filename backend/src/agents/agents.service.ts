import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) { }

  async onboard(createAgentDto: CreateAgentDto) {
    // 1. Check for duplicates (Email or Mobile)
    const existing = await this.prisma.agent.findFirst({
      where: {
        OR: [
          { email: createAgentDto.email },
          { mobile: createAgentDto.mobile }
        ]
      }
    });

    if (existing) {
      throw new ConflictException('Agent with this email or mobile already exists');
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(createAgentDto.password, 10);

    // 3. Create Agent in PENDING state
    const agent = await this.prisma.agent.create({
      data: {
        ...createAgentDto,
        password: hashedPassword,
        status: 'PENDING', // Default to Pending
      }
    });

    const { password, ...result } = agent;
    return result;
  }

  async findAll(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const where = status ? { status } : {};
    return this.prisma.agent.findMany({
      where,
      include: { documents: true },
      orderBy: { created_at: 'desc' }
    });
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { documents: true }
    });
    if (!agent) throw new NotFoundException(`Agent not found`);
    const { password, ...result } = agent;
    return result;
  }

  // Admin Action: Approve/Reject Agent
  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED', reason?: string) {
    return this.prisma.agent.update({
      where: { id },
      data: {
        status,
        rejection_reason: reason
      }
    });
  }

  async uploadDocument(agentId: string, fileUrl: string, title: string) {
    return this.prisma.agentDocument.create({
      data: {
        agent_id: agentId,
        file_url: fileUrl,
        title: title
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.agent.delete({
      where: { id },
    });
  }

  // Add this method inside AgentsService class
  async findByEmail(email: string) {
    return this.prisma.agent.findUnique({
      where: { email },
    });
  }
}