import { SetMetadata } from '@nestjs/common';

export const MANAGER_AREAS_KEY = 'managerAreas';

export const ManagerAreas = (...areas: string[]) =>
  SetMetadata(MANAGER_AREAS_KEY, areas);
