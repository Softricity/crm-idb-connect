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

      const { password, role, ...result } = newPartner;
      return {
        ...result,
        role: role.name, // Return role name as string
      };
    } catch (error) {
      throw new InternalServerErrorException('Could not create partner.');
    }
  }

  async findAll(roleName?: string) {
    // Filter by related role name if provided
    const whereClause = roleName ? { role: { name: roleName } } : {};

    const partners = await this.prisma.partners.findMany({
      where: whereClause,
      include: {
        role: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Map to return role.name as string and exclude password
    return partners.map((partner) => {
      const { password, role, ...rest } = partner;
      return {
        ...rest,
        role: role.name,
      };
    });
  }

  async findOne(id: string) {
    const partner = await this.prisma.partners.findUnique({
      where: { id },
      include: {
        role: true, // Fetch role object
      },
    });

    if (!partner) {
      throw new NotFoundException(`Partner with ID ${id} not found.`);
    }

    const { password, role, ...result } = partner;
    return {
      ...result,
      role: role.name, // Return role name as string
    };
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

      const { password, role, ...result } = updatedPartner;
      return {
        ...result,
        role: role.name, // Return role name as string
      };
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
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
  }
}