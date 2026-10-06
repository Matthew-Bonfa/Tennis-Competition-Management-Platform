import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required roles from the route handler or the controller class
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are explicitly required, allow access
    if (!requiredRoles) {
      return true;
    }

    // Extract the user attached to the request by the JwtStrategy
    const { user } = context.switchToHttp().getRequest();

    // Deny access if there is no user, or the user has no roles assigned
    if (!user || !user.roles) {
      return false;
    }

    // Grant access if the user has AT LEAST ONE of the required roles
    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
