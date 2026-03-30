import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../../common/types/permission';

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermission = (
  ...permissions: Permission[]
): ReturnType<typeof SetMetadata> =>
  SetMetadata(PERMISSIONS_KEY, permissions);
