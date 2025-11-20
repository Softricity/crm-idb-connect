import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { CreatePermissionGroupDto } from './dto/create-permission-group.dto';
import { UpdatePermissionGroupDto } from './dto/update-permission-group.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  // ==================== PERMISSIONS ====================
  
  async createPermission(createPermissionDto: CreatePermissionDto) {
    try {
      return await this.prisma.permission.create({
        data: createPermissionDto,
        include: {
          permission_group: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Permission with this name already exists');
      }
      throw error;
    }
  }

  async findAllPermissions() {
    return await this.prisma.permission.findMany({
      include: {
        permission_group: true,
        role_permissions: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOnePermission(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        permission_group: true,
        role_permissions: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async updatePermission(id: string, updatePermissionDto: UpdatePermissionDto) {
    try {
      return await this.prisma.permission.update({
        where: { id },
        data: updatePermissionDto,
        include: {
          permission_group: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Permission with this name already exists');
      }
      throw error;
    }
  }

  async removePermission(id: string) {
    try {
      return await this.prisma.permission.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }
      throw error;
    }
  }

  // ==================== PERMISSION GROUPS ====================
  
  async createPermissionGroup(createPermissionGroupDto: CreatePermissionGroupDto) {
    try {
      return await this.prisma.permission_group.create({
        data: createPermissionGroupDto,
        include: {
          permissions: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Permission group with this name already exists');
      }
      throw error;
    }
  }

  async findAllPermissionGroups() {
    return await this.prisma.permission_group.findMany({
      include: {
        permissions: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOnePermissionGroup(id: string) {
    const group = await this.prisma.permission_group.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });

    if (!group) {
      throw new NotFoundException(`Permission group with ID ${id} not found`);
    }

    return group;
  }

  async updatePermissionGroup(id: string, updatePermissionGroupDto: UpdatePermissionGroupDto) {
    try {
      return await this.prisma.permission_group.update({
        where: { id },
        data: updatePermissionGroupDto,
        include: {
          permissions: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Permission group with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Permission group with this name already exists');
      }
      throw error;
    }
  }

  async removePermissionGroup(id: string) {
    try {
      return await this.prisma.permission_group.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Permission group with ID ${id} not found`);
      }
      throw error;
    }
  }

  // ==================== ROLES ====================
  
  async createRole(createRoleDto: CreateRoleDto) {
    try {
      const { permissionIds, ...roleData } = createRoleDto;
      
      return await this.prisma.role.create({
        data: {
          ...roleData,
          role_permissions: permissionIds?.length ? {
            create: permissionIds.map(permissionId => ({
              permission_id: permissionId,
            })),
          } : undefined,
        },
        include: {
          role_permissions: {
            include: {
              permission: {
                include: {
                  permission_group: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Role with this name already exists');
      }
      throw error;
    }
  }

  async findAllRoles() {
    return await this.prisma.role.findMany({
      include: {
        role_permissions: {
          include: {
            permission: {
              include: {
                permission_group: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOneRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        role_permissions: {
          include: {
            permission: {
              include: {
                permission_group: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    try {
      const { permissionIds, ...roleData } = updateRoleDto;
      
      // If permissionIds are provided, we need to replace all role_permissions
      if (permissionIds !== undefined) {
        return await this.prisma.role.update({
          where: { id },
          data: {
            ...roleData,
            role_permissions: {
              deleteMany: {}, // Delete all existing permissions
              create: permissionIds.map(permissionId => ({
                permission_id: permissionId,
              })),
            },
          },
          include: {
            role_permissions: {
              include: {
                permission: {
                  include: {
                    permission_group: true,
                  },
                },
              },
            },
          },
        });
      }
      
      // If no permissionIds, just update role data
      return await this.prisma.role.update({
        where: { id },
        data: roleData,
        include: {
          role_permissions: {
            include: {
              permission: {
                include: {
                  permission_group: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Role with this name already exists');
      }
      throw error;
    }
  }

  async removeRole(id: string) {
    try {
      return await this.prisma.role.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
      throw error;
    }
  }

  // ==================== ROLE PERMISSIONS ====================
  
  async assignPermissionsToRole(assignPermissionsDto: AssignPermissionsDto) {
    const { role_id, permission_ids } = assignPermissionsDto;

    // Verify role exists
    const role = await this.prisma.role.findUnique({ where: { id: role_id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${role_id} not found`);
    }

    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permission_ids } },
    });

    if (permissions.length !== permission_ids.length) {
      throw new NotFoundException('One or more permission IDs are invalid');
    }

    // Delete existing role permissions
    await this.prisma.role_permission.deleteMany({
      where: { role_id },
    });

    // Create new role permissions
    const rolePermissions = permission_ids.map((permission_id) => ({
      role_id,
      permission_id,
    }));

    await this.prisma.role_permission.createMany({
      data: rolePermissions,
    });

    // Return updated role with permissions
    return await this.findOneRole(role_id);
  }

  async getRolePermissions(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        role_permissions: {
          include: {
            permission: {
              include: {
                permission_group: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    return role;
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    try {
      return await this.prisma.role_permission.delete({
        where: {
          role_id_permission_id: {
            role_id: roleId,
            permission_id: permissionId,
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Role permission not found');
      }
      throw error;
    }
  }
}
