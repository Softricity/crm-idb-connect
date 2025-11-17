// src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the roles required for this route (from the @Roles decorator)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no @Roles decorator is set, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get the user object from the request (attached by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Check if the user's role is included in the required roles
    return requiredRoles.some((role) => user.role === role);
  }
}