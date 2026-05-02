import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateDepartmentOrderDto } from './dto/update-department-order.dto';
import { UpsertDepartmentStatusesDto } from './dto/upsert-department-statuses.dto';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  private getDepartmentInclude(includeInactive: boolean) {
    if (includeInactive) {
      return {
        department_orders: true,
        department_statuses: { orderBy: { order_index: 'asc' as const } },
        _count: { select: { partner_departments: true } },
      };
    }

    return {
      department_orders: true,
      department_statuses: {
        where: { is_active: true },
        orderBy: { order_index: 'asc' as const },
      },
      _count: { select: { partner_departments: true } },
    };
  }

  private sortDepartmentsByOrder<T extends { name: string; department_orders: { order_index: number } | null }>(
    departments: T[],
  ): T[] {
    return [...departments].sort((a, b) => {
      const aIndex = a.department_orders?.order_index ?? Number.MAX_SAFE_INTEGER;
      const bIndex = b.department_orders?.order_index ?? Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      return a.name.localeCompare(b.name);
    });
  }


  private async getNextOrderIndex(client: DbClient): Promise<number> {
    const latest = await client.department_order.findFirst({
      orderBy: { order_index: 'desc' },
      select: { order_index: true },
    });
    return (latest?.order_index ?? -1) + 1;
  }

  private async ensureOrderIndexAvailable(
    orderIndex: number,
    client: DbClient,
    excludeDepartmentId?: string,
  ) {
    const existing = await client.department_order.findFirst({
      where: {
        order_index: orderIndex,
        ...(excludeDepartmentId
          ? { department_id: { not: excludeDepartmentId } }
          : {}),
      },
      select: { department_id: true },
    });

    if (existing) {
      throw new ConflictException(
        `Department order index ${orderIndex} is already assigned.`,
      );
    }
  }

  private async ensureDepartmentExists(departmentId: string) {
    const exists = await this.prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Department with ID ${departmentId} not found.`);
    }
  }

  async findAll(includeInactive = false) {
    const departments = await this.prisma.department.findMany({
      where: includeInactive ? {} : { is_active: true },
      include: this.getDepartmentInclude(includeInactive),
    });

    return this.sortDepartmentsByOrder(departments);
  }

  async findOne(id: string, includeInactive = true) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: this.getDepartmentInclude(includeInactive),
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found.`);
    }

    return department;
  }

  async create(dto: CreateDepartmentDto) {
    const normalizedName = dto.name.trim();
    const normalizedCode = dto.code.trim();

    const duplicate = await this.prisma.department.findFirst({
      where: {
        OR: [
          { name: { equals: normalizedName, mode: 'insensitive' } },
          { code: { equals: normalizedCode, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException('Department name or code already exists.');
    }

    return this.prisma.$transaction(async (tx) => {
      const nextOrderIndex =
        dto.order_index !== undefined
          ? dto.order_index
          : await this.getNextOrderIndex(tx);

      await this.ensureOrderIndexAvailable(nextOrderIndex, tx);

      if (dto.is_default === true) {
        await tx.department_order.updateMany({ data: { is_default: false } });
      }

      const department = await tx.department.create({
        data: {
          name: normalizedName,
          code: normalizedCode,
          is_active: dto.is_active ?? true,
        },
      });

      await tx.department_order.create({
        data: {
          department_id: department.id,
          order_index: nextOrderIndex,
          is_active: dto.is_active ?? true,
          is_default: dto.is_default ?? false,
        },
      });

      return tx.department.findUnique({
        where: { id: department.id },
        include: this.getDepartmentInclude(true),
      });
    });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.ensureDepartmentExists(id);

    const normalizedName = dto.name?.trim();
    const normalizedCode = dto.code?.trim();

    if (normalizedName || normalizedCode) {
      const duplicate = await this.prisma.department.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(normalizedName
              ? [{ name: { equals: normalizedName, mode: 'insensitive' as const } }]
              : []),
            ...(normalizedCode
              ? [{ code: { equals: normalizedCode, mode: 'insensitive' as const } }]
              : []),
          ],
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException('Department name or code already exists.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedDepartment = await tx.department.update({
        where: { id },
        data: {
          ...(normalizedName ? { name: normalizedName } : {}),
          ...(normalizedCode ? { code: normalizedCode } : {}),
          ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
        },
      });

      const touchesOrder =
        dto.order_index !== undefined ||
        dto.is_default !== undefined ||
        dto.is_active !== undefined;

      if (touchesOrder) {
        if (dto.order_index !== undefined) {
          await this.ensureOrderIndexAvailable(dto.order_index, tx, id);
        }

        const existingOrder = await tx.department_order.findUnique({
          where: { department_id: id },
        });

        if (dto.is_default === true) {
          await tx.department_order.updateMany({
            where: { department_id: { not: id } },
            data: { is_default: false },
          });
        }

        const nextOrderIndex =
          dto.order_index !== undefined
            ? dto.order_index
            : existingOrder?.order_index ?? (await this.getNextOrderIndex(tx));

        await tx.department_order.upsert({
          where: { department_id: id },
          create: {
            department_id: id,
            order_index: nextOrderIndex,
            is_active: dto.is_active ?? true,
            is_default: dto.is_default ?? false,
          },
          update: {
            order_index: nextOrderIndex,
            ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
            ...(dto.is_default !== undefined ? { is_default: dto.is_default } : {}),
          },
        });
      }

      return tx.department.findUnique({
        where: { id: updatedDepartment.id },
        include: this.getDepartmentInclude(true),
      });
    });
  }

  async updateOrder(dto: UpdateDepartmentOrderDto) {
    const normalizedItems = dto.items.map((item) => ({
      ...item,
      department_id: item.department_id.trim(),
    }));

    const uniqueDepartmentIds = new Set(normalizedItems.map((item) => item.department_id));
    if (uniqueDepartmentIds.size !== normalizedItems.length) {
      throw new BadRequestException('Duplicate department IDs are not allowed in order payload.');
    }

    const uniqueOrderIndexes = new Set(normalizedItems.map((item) => item.order_index));
    if (uniqueOrderIndexes.size !== normalizedItems.length) {
      throw new BadRequestException('Duplicate order indexes are not allowed in order payload.');
    }

    const defaultCount = normalizedItems.filter((item) => item.is_default === true).length;
    if (defaultCount > 1) {
      throw new BadRequestException('Only one department can be marked as default.');
    }

    const departmentIds = normalizedItems.map((item) => item.department_id);
    const departments = await this.prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true },
    });

    if (departments.length !== departmentIds.length) {
      throw new NotFoundException('One or more departments in payload were not found.');
    }

    const incomingIndexes = normalizedItems.map((item) => item.order_index);
    const conflicts = await this.prisma.department_order.findMany({
      where: {
        department_id: { notIn: departmentIds },
        order_index: { in: incomingIndexes },
      },
      select: { department_id: true, order_index: true },
    });

    if (conflicts.length > 0) {
      throw new ConflictException(
        `Order index ${conflicts[0].order_index} is already used by another department.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existingRows = await tx.department_order.findMany({
        where: { department_id: { in: departmentIds } },
      });
      const existingByDepartmentId = new Map(
        existingRows.map((row) => [row.department_id, row]),
      );

      let tempOrder = 1000000 + (Date.now() % 500000);
      for (const item of normalizedItems) {
        const existing = existingByDepartmentId.get(item.department_id);
        if (!existing) {
          continue;
        }

        await tx.department_order.update({
          where: { id: existing.id },
          data: { order_index: tempOrder++ },
        });
      }

      if (defaultCount > 0) {
        await tx.department_order.updateMany({ data: { is_default: false } });
      }

      for (const item of normalizedItems) {
        const existing = existingByDepartmentId.get(item.department_id);

        const resolvedIsDefault =
          defaultCount > 0
            ? item.is_default === true
            : item.is_default ?? existing?.is_default ?? false;

        const resolvedIsActive = item.is_active ?? existing?.is_active ?? true;

        await tx.department_order.upsert({
          where: { department_id: item.department_id },
          create: {
            department_id: item.department_id,
            order_index: item.order_index,
            is_active: resolvedIsActive,
            is_default: resolvedIsDefault,
          },
          update: {
            order_index: item.order_index,
            is_active: resolvedIsActive,
            is_default: resolvedIsDefault,
          },
        });
      }

      return tx.department_order.findMany({
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
        orderBy: { order_index: 'asc' },
      });
    });
  }

  async getStatuses(departmentId: string, includeInactive = false) {
    await this.ensureDepartmentExists(departmentId);

    return this.prisma.department_status.findMany({
      where: {
        department_id: departmentId,
        ...(includeInactive ? {} : { is_active: true }),
      },
      orderBy: { order_index: 'asc' },
    });
  }

  async upsertStatuses(departmentId: string, dto: UpsertDepartmentStatusesDto) {
    await this.ensureDepartmentExists(departmentId);

    const statuses = dto.statuses.map((status) => ({
      key: status.key.trim(),
      label: status.label.trim(),
      order_index: status.order_index,
      is_terminal: status.is_terminal ?? false,
      is_default: status.is_default ?? false,
      is_active: status.is_active ?? true,
    }));

    const keySet = new Set<string>();
    const orderSet = new Set<number>();
    for (const status of statuses) {
      const keyToken = status.key.toLowerCase();
      if (keySet.has(keyToken)) {
        throw new BadRequestException(`Duplicate status key '${status.key}' in payload.`);
      }
      keySet.add(keyToken);

      if (orderSet.has(status.order_index)) {
        throw new BadRequestException(
          `Duplicate status order_index '${status.order_index}' in payload.`,
        );
      }
      orderSet.add(status.order_index);
    }

    const activeStatuses = statuses.filter((status) => status.is_active !== false);
    const explicitDefault = activeStatuses.find((status) => status.is_default);
    const fallbackDefault = explicitDefault?.key ?? activeStatuses[0]?.key;

    return this.prisma.$transaction(async (tx) => {
      const existingStatuses = await tx.department_status.findMany({
        where: { department_id: departmentId },
      });
      const existingByKey = new Map(
        existingStatuses.map((status) => [status.key.toLowerCase(), status]),
      );

      for (const status of statuses) {
        const existing = existingByKey.get(status.key.toLowerCase());

        if (existing) {
          await tx.department_status.update({
            where: { id: existing.id },
            data: {
              key: status.key,
              label: status.label,
              order_index: status.order_index,
              is_terminal: status.is_terminal,
              is_default: false,
              is_active: status.is_active,
            },
          });
        } else {
          await tx.department_status.create({
            data: {
              department_id: departmentId,
              key: status.key,
              label: status.label,
              order_index: status.order_index,
              is_terminal: status.is_terminal,
              is_default: false,
              is_active: status.is_active,
            },
          });
        }
      }

      const inputKeys = statuses.map((status) => status.key);
      await tx.department_status.updateMany({
        where: {
          department_id: departmentId,
          key: { notIn: inputKeys },
        },
        data: {
          is_active: false,
          is_default: false,
        },
      });

      await tx.department_status.updateMany({
        where: { department_id: departmentId },
        data: { is_default: false },
      });

      if (fallbackDefault) {
        await tx.department_status.update({
          where: {
            department_id_key: {
              department_id: departmentId,
              key: fallbackDefault,
            },
          },
          data: { is_default: true },
        });
      }

      return tx.department_status.findMany({
        where: { department_id: departmentId },
        orderBy: { order_index: 'asc' },
      });
    });
  }
}
