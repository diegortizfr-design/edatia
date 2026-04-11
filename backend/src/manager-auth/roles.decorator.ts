import { SetMetadata } from '@nestjs/common';

export const MANAGER_ROLES_KEY = 'managerRoles';

export const ManagerRoles = (...roles: string[]) =>
  SetMetadata(MANAGER_ROLES_KEY, roles);
