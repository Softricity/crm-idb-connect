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
import { getScope } from '../common/utils/scope.util'; // 1. Import Scope Utility

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) { }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // 2. Update Create: Accept 'user' to assign branch_id
  async create(createPartnerDto: CreatePartnerDto, user: any) {
    // Verify Role
    const roleExists = await this.prisma.role.findUnique({
      where: { id: createPartnerDto.role_id },
    });
    if (!roleExists) throw new BadRequestException('Invalid Role ID provided');

    // Enforce: Only Super Admin can create Branch Manager or Super Admin
    const targetRoleName = (roleExists.name || '').toLowerCase();
    const creatorRoleName = (user?.role || '').toLowerCase();
    const creatingPrivilegedRole = targetRoleName === 'branch manager' || targetRoleName === 'super admin';
    if (creatingPrivilegedRole && creatorRoleName !== 'super admin') {
      throw new BadRequestException('Only Super Admin can create Branch Manager or Super Admin');
    }

    // Verify Duplicates
    const existingPartner = await this.prisma.partners.findFirst({
      where: {
        OR: [
          { email: createPartnerDto.email },
          { mobile: createPartnerDto.mobile },
        ],
      },
    });
    if (existingPartner) throw new ConflictException('Email or mobile already in use.');

    let targetBranchId = user.branch_id;

    // If Creator is "Head Office Admin", they can assign ANY branch
    if (user.branch_type === 'HeadOffice' && user.role === 'admin') {
      if (createPartnerDto.branch_id) {
        targetBranchId = createPartnerDto.branch_id;
      }
    }

    const hashedPassword = await this.hashPassword(createPartnerDto.password);

    try {
      const newPartner = await this.prisma.partners.create({
        data: {
          ...createPartnerDto,
          password: hashedPassword,
          branch_id: targetBranchId, // <--- AUTO-ASSIGN BRANCH
        },
        include: { role: true, branch: true },
      });

      const { password, role, ...result } = newPartner;
      return { ...result, role: role.name };
    } catch (error) {
      throw new InternalServerErrorException('Could not create partner.');
    }
  }

  // 3. Update FindAll: Accept 'user' to apply Scope
  async findAll(user: any, roleName?: string, branchId?: string) {
    // If branchId is provided, use it; otherwise use scope based on user's branch
    let whereClause: any;
    
    if (branchId) {
      // Filter by specific branch
      whereClause = {
        branch_id: branchId,
        ...(roleName ? { role: { name: roleName } } : {}),
      };
    } else {
      // Use scope-based filtering
      const scope = getScope(user);
      whereClause = {
        ...scope,
        ...(roleName ? { role: { name: roleName } } : {}),
      };
    }

    const partners = await this.prisma.partners.findMany({
      where: whereClause,
      include: { role: true, branch: true },
      orderBy: { created_at: 'desc' },
    });

    return partners.map((partner) => {
      const { password, role, ...rest } = partner;
      return { ...rest, role: role.name };
    });
  }

  async findOne(id: string) {
    const partner = await this.prisma.partners.findUnique({
      where: { id },
      include: { role: true, branch: true },
    });

    if (!partner) throw new NotFoundException(`Partner with ID ${id} not found.`);

    const { password, role, ...result } = partner;
    return { ...result, role: role.name };
  }

  async update(id: string, updatePartnerDto: UpdatePartnerDto) {
    if (updatePartnerDto.password) {
      updatePartnerDto.password = await this.hashPassword(updatePartnerDto.password);
    }

    try {
      const updatedPartner = await this.prisma.partners.update({
        where: { id },
        data: updatePartnerDto,
        include: { role: true, branch: true }
      });

      const { password, role, ...result } = updatedPartner;
      return { ...result, role: role.name };
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
    await this.prisma.partners.deleteMany({ where: { id: { in: dto.partnerIds } } });
    return { message: `Partners deleted successfully.` };
  }

  // 4. Critical: Ensure this includes 'branch' for the Auth Service
  async findOneByEmail(email: string) {
    return this.prisma.partners.findUnique({
      where: { email },
      include: {
        branch: true, // <--- REQUIRED FOR AUTH
        role: {
          include: {
            role_permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });
  }
}