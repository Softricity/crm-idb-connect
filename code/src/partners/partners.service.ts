// src/partners/partners.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import * as bcrypt from 'bcrypt';
import { BulkDeletePartnerDto } from './dto/bulk-delete.dto';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async create(createPartnerDto: CreatePartnerDto) {
    // Check for duplicate email or mobile
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

    // Hash the password
    const hashedPassword = await this.hashPassword(createPartnerDto.password);

    try {
      const newPartner = await this.prisma.partners.create({
        data: {
          ...createPartnerDto,
          password: hashedPassword, // Save the hashed password
        },
      });

      // Never return the password
      const { password, ...result } = newPartner;
      return result;
    } catch (error) {
      throw new InternalServerErrorException('Could not create partner.');
    }
  }

  async findAll(role?: 'agent' | 'counsellor' | 'admin') {
    return this.prisma.partners.findMany({
      where: {
        role: role, // Filter by role if provided
      },
      select: {
        // Explicitly exclude password
        id: true,
        role: true,
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
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const partner = await this.prisma.partners.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
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
      },
    });

    if (!partner) {
      throw new NotFoundException(`Partner with ID ${id} not found.`);
    }
    return partner;
  }

  async update(id: string, updatePartnerDto: UpdatePartnerDto) {
    // If a new password is provided, hash it.
    if (updatePartnerDto.password) {
      updatePartnerDto.password = await this.hashPassword(
        updatePartnerDto.password,
      );
    }

    try {
      const updatedPartner = await this.prisma.partners.update({
        where: { id },
        data: updatePartnerDto,
      });

      const { password, ...result } = updatedPartner;
      return result;
    } catch (error) {
      // P2025 is Prisma's "Record not found" error
      if (error.code === 'P2025') {
        throw new NotFoundException(`Partner with ID ${id} not found.`);
      }
      // P2002 is unique constraint violation (e.g., email/mobile)
      if (error.code === 'P2002') {
        throw new ConflictException('Email or mobile number already in use.');
      }
      throw new InternalServerErrorException('Could not update partner.');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.partners.delete({
        where: { id },
      });
      return { message: `Partner with ID ${id} deleted successfully.` };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Partner with ID ${id} not found.`);
      }
      throw new InternalServerErrorException('Could not delete partner.');
    }
  }

  async findOneByEmail(email: string) {
    return this.prisma.partners.findUnique({
      where: { email },
    });
  }

  async bulkRemove(bulkDeletePartnerDto: BulkDeletePartnerDto) {
    const { partnerIds } = bulkDeletePartnerDto;

    // Safety check: Prevent deleting yourself (optional but recommended)
    // You would need to pass the current userId to this method to check.

    const result = await this.prisma.partners.deleteMany({
      where: {
        id: { in: partnerIds },
      },
    });

    return { message: `Successfully deleted ${result.count} partners.` };
  }
}