import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  // 1. Admin creates commission
  @Post()
  @Roles(Role.Admin, Role.SuperAdmin)
  create(@Body() createCommissionDto: CreateCommissionDto) {
    return this.commissionsService.create(createCommissionDto);
  }

  // 2. Admin views all
  @Get()
  @Roles(Role.Admin, Role.SuperAdmin)
  findAll() {
    return this.commissionsService.findAll();
  }

  // 3. Agent views OWN commissions
  // Access: Any Agent
  @Get('my-commissions')
  findMyCommissions(@Request() req) {
    // req.user.sub is the user ID from JWT
    // Ensure the user has role 'agent' in frontend logic or guard if needed, 
    // but typically finding by ID is safe if ID is from token.
    return this.commissionsService.findMyCommissions(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commissionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  update(@Param('id') id: string, @Body() updateCommissionDto: UpdateCommissionDto) {
    return this.commissionsService.update(id, updateCommissionDto);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  remove(@Param('id') id: string) {
    return this.commissionsService.remove(id);
  }
}