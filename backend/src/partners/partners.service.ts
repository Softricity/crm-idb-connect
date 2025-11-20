// src/partners/partners.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import * as bcrypt from 'bcrypt';
import { BulkDeletePartnerDto } from './dto/bulk-delete.dto';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) { }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async create(createPartnerDto: CreatePartnerDto) {
    // 1. Verify the Role ID exists
    const roleExists = await this.prisma.role.findUnique({
      where: { id: createPartnerDto.role_id },
    });
    if (!roleExists) {
      throw new BadRequestException('Invalid Role ID provided');
    }

    // 2. Check for duplicate email or mobile
    const existingPartner = await this.prisma.partners.findFirst({
      where: {
        OR: [
          { email: createPartnerDto.email },
          { mobile: createPartnerDto.mobile },
        ],
      },
    });

    if (existingPartner) {
      throw new ConflictException('Email or mobile number already in use.');
    }

    // 3. Hash password and Create
    const hashedPassword = await this.hashPassword(createPartnerDto.password);

    try {
      const newPartner = await this.prisma.partners.create({
        data: {
          ...createPartnerDto,
          password: hashedPassword,
        },
        include: {
          role: true, // Include role details in return
        },
      });

      const { password, ...result } = newPartner;
      return result;
    } catch (error) {
      throw new InternalServerErrorException('Could not create partner.');
    }
  }

  async findAll(roleName?: string) {
    // Filter by related role name if provided
    const whereClause = roleName ? { role: { name: roleName } } : {};

    return this.prisma.partners.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        address: true,
        city: true,
        state: true,
        area: true,
        zone: true,
        remarks: true,
        agency_name: true,
        created_at: true,
        role_id: true,
        role: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const partner = await this.prisma.partners.findUnique({
      where: { id },
      include: {
        role: true, // Return full role object
      },
    });

    if (!partner) {
      throw new NotFoundException(`Partner with ID ${id} not found.`);
    }

    const { password, ...result } = partner;
    return result;
  }

  async update(id: string, updatePartnerDto: UpdatePartnerDto) {
    if (updatePartnerDto.password) {
      updatePartnerDto.password = await this.hashPassword(updatePartnerDto.password);
    }

    try {
      const updatedPartner = await this.prisma.partners.update({
        where: { id },
        data: updatePartnerDto,
        include: { role: true }
      });

      const { password, ...result } = updatedPartner;
      return result;
    } catch (error) {
      if (error.code === 'P2025') throw new NotFoundException(`Partner with ID ${id} not found.`);
      if (error.code === 'P2002') throw new ConflictException('Email or mobile number already in use.');
      throw new InternalServerErrorException('Could not update partner.');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.partners.delete({ where: { id } });
      return { message: `Partner deleted successfully.` };
    } catch (error) {
      throw new InternalServerErrorException('Could not delete partner.');
    }
  }

  async bulkRemove(dto: BulkDeletePartnerDto) {
    await this.prisma.partners.deleteMany({
      where: { id: { in: dto.partnerIds } },
    });
    return { message: `Partners deleted successfully.` };
  }

  async findOneByEmail(email: string) {
    return this.prisma.partners.findUnique({
      where: { email },
      include: { role: true }
    });
  }
}