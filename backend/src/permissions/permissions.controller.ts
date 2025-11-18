import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { CreatePermissionGroupDto } from './dto/create-permission-group.dto';
import { UpdatePermissionGroupDto } from './dto/update-permission-group.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permission.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(RolesGuard)
@Controller()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // ==================== PERMISSIONS ====================
  
  /**
   * Create a new permission
   * POST /permissions
   */
  @Post('permissions')
  @Roles(Role.Admin)
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.createPermission(createPermissionDto);
  }

  /**
   * Get all permissions
   * GET /permissions
   */
  @Get('permissions')
  @Roles(Role.Admin, Role.Counsellor)
  findAllPermissions() {
    return this.permissionsService.findAllPermissions();
  }

  /**
   * Get a single permission
   * GET /permissions/:id
   */
  @Get('permissions/:id')
  @Roles(Role.Admin, Role.Counsellor)
  findOnePermission(@Param('id') id: string) {
    return this.permissionsService.findOnePermission(id);
  }

  /**
   * Update a permission
   * PATCH /permissions/:id
   */
  @Patch('permissions/:id')
  @Roles(Role.Admin)
  updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.updatePermission(id, updatePermissionDto);
  }

  /**
   * Delete a permission
   * DELETE /permissions/:id
   */
  @Delete('permissions/:id')
  @Roles(Role.Admin)
  removePermission(@Param('id') id: string) {
    return this.permissionsService.removePermission(id);
  }

  // ==================== PERMISSION GROUPS ====================
  
  /**
   * Create a new permission group
   * POST /permission-groups
   */
  @Post('permission-groups')
  @Roles(Role.Admin)
  createPermissionGroup(@Body() createPermissionGroupDto: CreatePermissionGroupDto) {
    return this.permissionsService.createPermissionGroup(createPermissionGroupDto);
  }

  /**
   * Get all permission groups
   * GET /permission-groups
   */
  @Get('permission-groups')
  @Roles(Role.Admin, Role.Counsellor)
  findAllPermissionGroups() {
    return this.permissionsService.findAllPermissionGroups();
  }

  /**
   * Get a single permission group
   * GET /permission-groups/:id
   */
  @Get('permission-groups/:id')
  @Roles(Role.Admin, Role.Counsellor)
  findOnePermissionGroup(@Param('id') id: string) {
    return this.permissionsService.findOnePermissionGroup(id);
  }

  /**
   * Update a permission group
   * PATCH /permission-groups/:id
   */
  @Patch('permission-groups/:id')
  @Roles(Role.Admin)
  updatePermissionGroup(
    @Param('id') id: string,
    @Body() updatePermissionGroupDto: UpdatePermissionGroupDto,
  ) {
    return this.permissionsService.updatePermissionGroup(id, updatePermissionGroupDto);
  }

  /**
   * Delete a permission group
   * DELETE /permission-groups/:id
   */
  @Delete('permission-groups/:id')
  @Roles(Role.Admin)
  removePermissionGroup(@Param('id') id: string) {
    return this.permissionsService.removePermissionGroup(id);
  }

  // ==================== ROLES ====================
  
  /**
   * Create a new role
   * POST /roles
   */
  @Post('roles')
  @Roles(Role.Admin)
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.permissionsService.createRole(createRoleDto);
  }

  /**
   * Get all roles
   * GET /roles
   */
  @Get('roles')
  @Roles(Role.Admin, Role.Counsellor)
  findAllRoles() {
    return this.permissionsService.findAllRoles();
  }

  /**
   * Get a single role
   * GET /roles/:id
   */
  @Get('roles/:id')
  @Roles(Role.Admin, Role.Counsellor)
  findOneRole(@Param('id') id: string) {
    return this.permissionsService.findOneRole(id);
  }

  /**
   * Update a role
   * PATCH /roles/:id
   */
  @Patch('roles/:id')
  @Roles(Role.Admin)
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.permissionsService.updateRole(id, updateRoleDto);
  }

  /**
   * Delete a role
   * DELETE /roles/:id
   */
  @Delete('roles/:id')
  @Roles(Role.Admin)
  removeRole(@Param('id') id: string) {
    return this.permissionsService.removeRole(id);
  }

  // ==================== ROLE PERMISSIONS ====================
  
  /**
   * Assign permissions to a role
   * POST /roles/assign-permissions
   */
  @Post('roles/assign-permissions')
  @Roles(Role.Admin)
  assignPermissionsToRole(@Body() assignPermissionsDto: AssignPermissionsDto) {
    return this.permissionsService.assignPermissionsToRole(assignPermissionsDto);
  }

  /**
   * Get all permissions for a role
   * GET /roles/:id/permissions
   */
  @Get('roles/:id/permissions')
  @Roles(Role.Admin, Role.Counsellor)
  getRolePermissions(@Param('id') id: string) {
    return this.permissionsService.getRolePermissions(id);
  }

  /**
   * Remove a permission from a role
   * DELETE /roles/:roleId/permissions/:permissionId
   */
  @Delete('roles/:roleId/permissions/:permissionId')
  @Roles(Role.Admin)
  removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.permissionsService.removePermissionFromRole(roleId, permissionId);
  }
}
