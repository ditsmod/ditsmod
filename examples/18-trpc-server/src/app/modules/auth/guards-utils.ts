import { createHelperForGuardWithParams } from '@ditsmod/trpc';

import { PermissionsGuard } from './permissions.guard.js';
import type { Permission } from './types.js';

export const requirePermissions = createHelperForGuardWithParams<Permission>(PermissionsGuard);
