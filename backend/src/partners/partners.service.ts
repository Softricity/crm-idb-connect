// src/partners/partners.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import * as bcrypt from 'bcrypt';
import { BulkDeletePartnerDto } from './dto/bulk-delete.dto';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) { }

  private readonly partnerInclude = {
    role: true,
    branch: true,
    partner_departments: {
      where: { is_active: true },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            is_active: true,
          },
        },
      },
      orderBy: { created_at: 'asc' as const },
    },
  };

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private buildScope(user: any, branchId?: string) {
    if (branchId) {
      return { branch_id: branchId };
    }

    const userRole =
      typeof user?.role === 'string'
        ? user.role.toLowerCase()
        : (user?.role?.name || '').toLowerCase();

    const canViewAll =
      user?.branch_type === 'HeadOffice' &&
      (userRole === 'admin' || userRole === 'super admin');

    if (canViewAll) {
      return {};
    }

    if (!user?.branch_id) {
      return { branch_id: '00000000-0000-0000-0000-000000000000' };
    }

    return { branch_id: user.branch_id };
  }

  private mapPartnerForResponse(partner: any) {
    const { password, role, partner_departments, ...rest } = partner;
    const activeDepartments = (partner_departments || []).filter(
      (department: any) => department.is_active,
    );
    const departmentIds = activeDepartments.map(
      (department: any) => department.department_id,
    );
    const primaryDepartmentId =
      activeDepartments.find((department: any) => department.is_primary)
        ?.department_id ?? null;

    return {
      ...rest,
      role: role?.name,
      partner_departments: activeDepartments,
      department_ids: departmentIds,
      primary_department_id: primaryDepartmentId,
    };
  }

  private normalizeDepartmentIds(departmentIds?: string[]) {
    if (!departmentIds) {
      return [];
    }

    const normalizedIds = departmentIds
      .map((departmentId) => departmentId?.trim())
      .filter((departmentId): departmentId is string => Boolean(departmentId));

    return Array.from(new Set(normalizedIds));
  }

  private async ensureActiveDepartmentsExist(
    client: DbClient,
    departmentIds: string[],
  ) {
    if (departmentIds.length === 0) {
      return;
    }

    const existing = await client.department.findMany({
      where: {
        id: { in: departmentIds },
        is_active: true,
      },
      select: { id: true },
    });

    if (existing.length !== departmentIds.length) {
      const existingSet = new Set(existing.map((department) => department.id));
      const invalidDepartmentIds = departmentIds.filter(
        (departmentId) => !existingSet.has(departmentId),
      );
      throw new BadRequestException(
        `Invalid or inactive department IDs: ${invalidDepartmentIds.join(', ')}`,
      );
    }
  }

  private async syncPartnerDepartments(
    client: DbClient,
    partnerId: string,
    departmentIdsInput?: string[],
    primaryDepartmentIdInput?: string,
  ) {
    const shouldUpdateDepartmentIds = departmentIdsInput !== undefined;
    const shouldUpdatePrimaryDepartment = primaryDepartmentIdInput !== undefined;

    if (!shouldUpdateDepartmentIds && !shouldUpdatePrimaryDepartment) {
      return;
    }

    const existingAssignments = await client.partner_department.findMany({
      where: {
        partner_id: partnerId,
        is_active: true,
      },
      orderBy: { created_at: 'asc' },
      select: {
        department_id: true,
        is_primary: true,
      },
    });

    const existingDepartmentIds = existingAssignments.map(
      (assignment) => assignment.department_id,
    );
    let targetDepartmentIds = shouldUpdateDepartmentIds
      ? this.normalizeDepartmentIds(departmentIdsInput)
      : existingDepartmentIds;

    const requestedPrimaryDepartmentId = primaryDepartmentIdInput?.trim();
    if (requestedPrimaryDepartmentId) {
      if (!targetDepartmentIds.includes(requestedPrimaryDepartmentId)) {
        if (shouldUpdateDepartmentIds) {
          throw new BadRequestException(
            'Primary department must be included in department_ids.',
          );
        }

        targetDepartmentIds = [
          ...targetDepartmentIds,
          requestedPrimaryDepartmentId,
        ];
      }
    }

    await client.partner_department.updateMany({
      where: { partner_id: partnerId },
      data: {
        is_active: false,
        is_primary: false,
      },
    });

    if (targetDepartmentIds.length === 0) {
      return;
    }

    await this.ensureActiveDepartmentsExist(client, targetDepartmentIds);

    const existingPrimaryDepartmentId = existingAssignments.find(
      (assignment) => assignment.is_primary,
    )?.department_id;

    const resolvedPrimaryDepartmentId =
      requestedPrimaryDepartmentId ||
      (existingPrimaryDepartmentId &&
      targetDepartmentIds.includes(existingPrimaryDepartmentId)
        ? existingPrimaryDepartmentId
        : targetDepartmentIds[0]);

    for (const departmentId of targetDepartmentIds) {
      await client.partner_department.upsert({
        where: {
          partner_id_department_id: {
            partner_id: partnerId,
            department_id: departmentId,
          },
        },
        create: {
          partner_id: partnerId,
          department_id: departmentId,
          is_active: true,
          is_primary: departmentId === resolvedPrimaryDepartmentId,
        },
        update: {
          is_active: true,
          is_primary: departmentId === resolvedPrimaryDepartmentId,
        },
      });
    }
  }

  // 2. Update Create: Accept 'user' to assign branch_id
  async create(createPartnerDto: CreatePartnerDto, user: any) {
    const {
      department_ids,
      primary_department_id,
      ...partnerData
    } = createPartnerDto;

    // Verify Role
    const roleExists = await this.prisma.role.findUnique({
      where: { id: partnerData.role_id },
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
          { email: partnerData.email },
          { mobile: partnerData.mobile },
        ],
      },
    });
    if (existingPartner) throw new ConflictException('Email or mobile already in use.');

    let targetBranchId = user.branch_id;

    // If creator is Head Office Admin/Super Admin, they can assign any branch.
    if (
      user.branch_type === 'HeadOffice' &&
      (creatorRoleName === 'admin' || creatorRoleName === 'super admin')
    ) {
      if (partnerData.branch_id) {
        targetBranchId = partnerData.branch_id;
      }
    }

    const hashedPassword = await this.hashPassword(partnerData.password);

    try {
      const newPartner = await this.prisma.$transaction(async (tx) => {
        const createdPartner = await tx.partners.create({
          data: {
            ...partnerData,
            password: hashedPassword,
            branch_id: targetBranchId,
          },
        });

        await this.syncPartnerDepartments(
          tx,
          createdPartner.id,
          department_ids,
          primary_department_id,
        );

        return tx.partners.findUnique({
          where: { id: createdPartner.id },
          include: this.partnerInclude,
        });
      });

      if (!newPartner) {
        throw new InternalServerErrorException('Could not create partner.');
      }

      return this.mapPartnerForResponse(newPartner);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Could not create partner.');
    }
  }

  // 3. Update FindAll: Accept 'user' to apply Scope
  async findAll(user: any, roleName?: string, branchId?: string) {
    const whereClause = {
      ...this.buildScope(user, branchId),
      ...(roleName ? { role: { name: roleName } } : {}),
    };

    const partners = await this.prisma.partners.findMany({
      where: whereClause,
      include: this.partnerInclude,
      orderBy: { created_at: 'desc' },
    });

    return partners.map((partner) => this.mapPartnerForResponse(partner));
  }

  async findOne(id: string) {
    const partner = await this.prisma.partners.findUnique({
      where: { id },
      include: this.partnerInclude,
    });

    if (!partner) throw new NotFoundException(`Partner with ID ${id} not found.`);

    return this.mapPartnerForResponse(partner);
  }

  async update(id: string, updatePartnerDto: UpdatePartnerDto) {
    const {
      department_ids,
      primary_department_id,
      ...partnerData
    } = updatePartnerDto as UpdatePartnerDto & {
      department_ids?: string[];
      primary_department_id?: string;
    };

    if (partnerData.password) {
      partnerData.password = await this.hashPassword(partnerData.password);
    }

    try {
      const updatedPartner = await this.prisma.$transaction(async (tx) => {
        const hasProfileChanges = Object.keys(partnerData).length > 0;

        if (hasProfileChanges) {
          await tx.partners.update({
            where: { id },
            data: partnerData,
          });
        } else {
          const exists = await tx.partners.findUnique({
            where: { id },
            select: { id: true },
          });

          if (!exists) {
            throw new NotFoundException(`Partner with ID ${id} not found.`);
          }
        }

        await this.syncPartnerDepartments(
          tx,
          id,
          department_ids,
          primary_department_id,
        );

        return tx.partners.findUnique({
          where: { id },
          include: this.partnerInclude,
        });
      });

      if (!updatedPartner) {
        throw new NotFoundException(`Partner with ID ${id} not found.`);
      }

      return this.mapPartnerForResponse(updatedPartner);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
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
        partner_departments: {
          where: { is_active: true },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
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

  async findOneForAuthById(id: string) {
    return this.prisma.partners.findUnique({
      where: { id },
      include: {
        branch: true,
        partner_departments: {
          where: { is_active: true },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        role: {
          include: {
            role_permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
  }
}
