import { createHelperForGuardWithParams } from '@ditsmod/trpc';

import { PermissionsGuard } from './permissions.guard.js';
import { Permission } from './types.js';

export const requirePermissions = createHelperForGuardWithParams<Permission>(PermissionsGuard);
