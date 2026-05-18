import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ManagerJwtPayload } from './manager-jwt.strategy';

@Injectable()
export class ManagerAreasGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAreas = this.reflector.getAllAndOverride<string[]>(
      'managerAreas',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAreas || requiredAreas.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: ManagerJwtPayload }>();
    const user = request.user;

    if (!user) {
      return false;
    }

    // El ADMIN tiene acceso a todo, ignora el área
    if (user.rol === 'ADMIN') {
      return true;
    }

    return user.area ? requiredAreas.includes(user.area) : false;
  }
}
