// src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // ✅ Fix: Safety check if user or role is missing
    if (!user || !user.role) {
        return false;
    }

    // Normalize user role
    const userRole = user.role.toLowerCase();

    return requiredRoles.some((role) => {
      const requiredRole = role.toLowerCase();
      
      // ✅ Allow "Super Admin" to access "Admin" routes
      if (userRole === 'super admin' && requiredRole === 'admin') {
          return true;
      }

      // Standard check (exact match or partial, e.g., "super admin" includes "admin")
      return userRole === requiredRole || userRole.includes(requiredRole);
    });
  }
}