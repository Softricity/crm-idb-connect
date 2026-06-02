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

      if (requiredRole === 'agent' && user?.type === 'agent_team_member') {
        return true;
      }
      
      // ✅ Allow "Super Admin" to access "Admin" routes
      if (userRole === 'super admin' && requiredRole === 'admin') {
          return true;
      }

      // Allow any internal CRM staff member (partner) to access Counsellor-level routes
      if (user?.type === 'partner' && (requiredRole === 'counsellor' || requiredRole === 'counselor')) {
        return true;
      }

      // Standard check (exact match or partial, e.g., "super admin" includes "admin")
      // Normalize spelling of counsellor/counselor
      const normUser = userRole.replace('counsellor', 'counselor');
      const normReq = requiredRole.replace('counsellor', 'counselor');
      return normUser === normReq || normUser.includes(normReq);
    });
  }
}
