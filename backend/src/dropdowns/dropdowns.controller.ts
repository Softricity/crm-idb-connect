import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { DropdownsService } from './dropdowns.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { Public } from '../auth/public.decorator';

@Controller('dropdowns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DropdownsController {
  constructor(private readonly dropdownsService: DropdownsService) {}

  // --- Categories ---

  @Post('categories')
  @Roles(Role.Admin, Role.SuperAdmin)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.dropdownsService.createCategory(dto);
  }

  @Get('categories')
  findAllCategories() {
    return this.dropdownsService.findAllCategories();
  }

  @Delete('categories/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  deleteCategory(@Param('id') id: string) {
    return this.dropdownsService.deleteCategory(id);
  }

  // --- Options ---

  @Post('options')
  @Roles(Role.Admin, Role.SuperAdmin)
  createOption(@Body() dto: CreateOptionDto) {
    return this.dropdownsService.createOption(dto);
  }

  @Patch('options/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  updateOption(@Param('id') id: string, @Body() dto: UpdateOptionDto) {
    return this.dropdownsService.updateOption(id, dto);
  }

  @Delete('options/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  deleteOption(@Param('id') id: string) {
    return this.dropdownsService.deleteOption(id);
  }

  @Public()
  @Post('seed-defaults')
  async seedDefaults() {
    // 1. Create Default Categories
    const categories = ['reasons', 'countries', 'intakes', 'lead_status'];
    
    const results: (object | { name: string; status: string })[] = [];
    
    for (const name of categories) {
      try {
        const cat = await this.dropdownsService.createCategory({ 
          name, 
          label: name.charAt(0).toUpperCase() + name.slice(1) // Capitalize: "Reasons"
        });
        results.push(cat);
      } catch (e) {
        // Ignore if already exists
        results.push({ name, status: 'Already Exists' });
      }
    }
    return { message: "Defaults seeded", results };
  }
}