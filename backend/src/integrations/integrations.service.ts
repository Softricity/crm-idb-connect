import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { IntegrationProvider } from '@prisma/client';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.integrationConfig.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findByProvider(provider: IntegrationProvider) {
    const config = await this.prisma.integrationConfig.findUnique({
      where: { provider },
    });
    return config;
  }

  async upsert(dto: CreateIntegrationDto) {
    const { provider, ...data } = dto;
    
    // If we are activating/connecting, set connected_at
    const updateData: any = { ...data };
    if (data.is_active === true) {
      updateData.connected_at = new Date();
    }

    return this.prisma.integrationConfig.upsert({
      where: { provider },
      create: {
        provider,
        ...updateData,
      },
      update: updateData,
    });
  }

  async update(id: string, dto: UpdateIntegrationDto) {
    const config = await this.prisma.integrationConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    const updateData: any = { ...dto };
    const anyDto = dto as any;
    if (anyDto.is_active === true && !config.is_active) {
      updateData.connected_at = new Date();
    }


    return this.prisma.integrationConfig.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.integrationConfig.delete({
      where: { id },
    });
  }
}
