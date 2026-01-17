import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateOptionDto } from './dto/create-option.dto';

@Injectable()
export class DropdownsService {
  constructor(private prisma: PrismaService) {}

  // --- Category Management ---

  async createCategory(dto: CreateCategoryDto) {
    // Check if exists
    const exists = await this.prisma.dropdownCategory.findUnique({
      where: { name: dto.name }
    });
    if (exists) throw new BadRequestException(`Category '${dto.name}' already exists`);

    return this.prisma.dropdownCategory.create({
      data: {
        name: dto.name,
        label: dto.label || dto.name,
        is_system: false // User created categories are never system
      }
    });
  }

  async findAllCategories() {
    return this.prisma.dropdownCategory.findMany({
      include: {
        options: {
          orderBy: { label: 'asc' }
        }
      },
      orderBy: { label: 'asc' }
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.dropdownCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    if (category.is_system) throw new BadRequestException('Cannot delete system categories');

    return this.prisma.dropdownCategory.delete({ where: { id } });
  }

  // --- Option Management ---

  async createOption(dto: CreateOptionDto) {
    return this.prisma.dropdownOption.create({
      data: {
        label: dto.label,
        value: dto.value,
        category_id: dto.category_id
      }
    });
  }

  async updateOption(id: string, data: { label?: string; value?: string; is_active?: boolean }) {
    const option = await this.prisma.dropdownOption.findUnique({ where: { id } });
    if (!option) throw new NotFoundException('Option not found');

    return this.prisma.dropdownOption.update({
      where: { id },
      data: data
    });
  }

  async deleteOption(id: string) {
    return this.prisma.dropdownOption.delete({ where: { id } });
  }
}