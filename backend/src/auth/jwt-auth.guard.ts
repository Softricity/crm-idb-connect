// src/auth/jwt-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;
      if (authHeader) {
        try {
          const result = super.canActivate(context);
          if (result instanceof Promise) {
            await result;
          } else if (result && typeof (result as any).subscribe === 'function') {
            await new Promise((resolve) => {
              (result as any).subscribe({
                next: (val) => resolve(val),
                error: () => resolve(false),
              });
            });
          }
        } catch (error) {
          // Suppress error so public routes continue to work
        }
      }
      return true;
    }

    const result = super.canActivate(context);
    if (result instanceof Promise) {
      return await result;
    }
    return result as boolean;
  }
}