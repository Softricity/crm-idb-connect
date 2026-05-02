import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { Prisma } from '@prisma/client';
import { SupabaseService } from '../storage/supabase.service';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class UniversitiesService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  private resolvePublicBaseUrl(req?: any): string {
    const envUrl = process.env.API_BASE_URL || process.env.BACKEND_PUBLIC_URL;
    if (envUrl) return envUrl.replace(/\/+$/, '');
    if (!req) return 'http://localhost:5005';

    const forwardedProto = (req.headers?.['x-forwarded-proto'] || '').toString().split(',')[0].trim();
    const forwardedHost = (req.headers?.['x-forwarded-host'] || '').toString().split(',')[0].trim();
    const protocol = forwardedProto || req.protocol || 'http';
    const host = forwardedHost || req.get?.('host') || req.headers?.host;
    if (!host) return 'http://localhost:5005';
    return `${protocol}://${host}`;
  }

  async uploadLogo(file: Express.Multer.File, req?: any): Promise<string | undefined> {
    if (!file) return undefined;

    const folder = `universities/logos/${Date.now()}`;
    const bucket = process.env.SUPABASE_BUCKET || 'idb-student-documents';
    let fileUrl: string;

    try {
      fileUrl = await this.supabaseService.uploadFile(file, folder, bucket);
    } catch (error) {
      console.error('[UniversitiesService] Logo upload fallback activated', error);

      const uploadsDir = path.join(process.cwd(), 'uploads', folder);
      await fs.mkdir(uploadsDir, { recursive: true });
      const safeName = `${Date.now()}-${(file.originalname || 'logo').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const fullPath = path.join(uploadsDir, safeName);
      await fs.writeFile(fullPath, file.buffer);

      const baseUrl = this.resolvePublicBaseUrl(req);
      fileUrl = `/uploads/${folder}/${safeName}`;
    }

    return fileUrl;
  }

  async create(createUniversityDto: CreateUniversityDto, logoFile?: Express.Multer.File, req?: any) {
    const { countryId, allowed_countries, ...data } = createUniversityDto;
    
    const country = await this.prisma.country.findUnique({ where: { id: countryId } });
    if (!country) throw new NotFoundException(`Country ${countryId} not found`);

    let logoUrl = createUniversityDto.logo;
    if (logoFile) {
      logoUrl = await this.uploadLogo(logoFile, req);
    }

    return this.prisma.university.create({
      data: {
        ...data,
        logo: logoUrl,
        allowed_countries: Array.isArray(allowed_countries)
          ? Array.from(new Set(allowed_countries.filter(Boolean)))
          : [],
        countryId: countryId,
      },
    });
  }

  async findAll(user?: any, countryId?: string) {
    const where: Prisma.UniversityWhereInput = {};

    if (countryId) {
      where.countryId = countryId;
    }

    const isAgentContext =
      user?.role === 'agent' ||
      user?.type === 'agent' ||
      user?.type === 'agent_team_member';
    if (isAgentContext) {
      const agentId = user?.type === 'agent_team_member' ? user?.parent_agent_id : user?.id || user?.userId;
      if (agentId) {
        const accessRows = await this.prisma.agentUniversityAccess.findMany({
          where: { agent_id: agentId },
          select: { university_id: true },
        });
        const accessibleIds = accessRows.map((r) => r.university_id);
        if (accessibleIds.length === 0) {
          return [];
        }
        where.id = { in: accessibleIds };
      }
    }

    return this.prisma.university.findMany({
      where,
      include: {
        country: true,
        _count: { select: { courses: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findAllWithAccess(user: any) {
    const agentId = user?.type === 'agent_team_member' ? user?.parent_agent_id : user?.id || user?.userId;
    const [universities, rows] = await Promise.all([
      this.prisma.university.findMany({
        include: { country: true, _count: { select: { courses: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.agentUniversityAccess.findMany({
        where: { agent_id: agentId },
        select: { university_id: true },
      }),
    ]);
    const allowed = new Set(rows.map((r) => r.university_id));
    return universities.map((u) => ({
      ...u,
      is_accessible: allowed.has(u.id),
    }));
  }

  async findOne(id: string) {
    const university = await this.prisma.university.findUnique({
      where: { id },
      include: { country: true, courses: true },
    });
    if (!university) throw new NotFoundException(`University ${id} not found`);
    return university;
  }

  async update(id: string, updateUniversityDto: UpdateUniversityDto, logoFile?: Express.Multer.File, req?: any) {
    try {
        const { countryId, allowed_countries, ...data } = updateUniversityDto;
        
        let logoUrl = updateUniversityDto.logo;
        if (logoFile) {
          logoUrl = await this.uploadLogo(logoFile, req);
        }

        return await this.prisma.university.update({
            where: { id },
            data: {
                ...data,
                logo: logoUrl,
                ...(countryId && { countryId }),
                ...(allowed_countries
                  ? { allowed_countries: Array.from(new Set(allowed_countries.filter(Boolean))) }
                  : {}),
            },
        });
    } catch (error) {
        if (error.code === 'P2025') throw new NotFoundException(`University ${id} not found`);
        throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.university.delete({ where: { id } });
      return { message: `University ${id} deleted successfully` };
    } catch (error) {
      if (error.code === 'P2025') throw new NotFoundException(`University ${id} not found`);
      throw error;
    }
  }
}
