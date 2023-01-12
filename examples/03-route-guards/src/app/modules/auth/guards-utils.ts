import { createHelperForGuardWithParams } from '@ditsmod/core';

import { PermissionsGuard } from './permissions.guard';
import { Permission } from './types';

export const requirePermissions = createHelperForGuardWithParams<Permission>(PermissionsGuard);
