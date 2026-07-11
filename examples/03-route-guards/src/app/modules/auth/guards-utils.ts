import { createGuardHelper } from '@ditsmod/rest';

import { RequestScopedPermissionsGuard } from './permissions.guard.js';
import type { Permission } from './types.js';
import { RouteScopedPermissionsGuard } from './ctx-permissions.guard.js';
import { RequestScopedBasicGuard } from './basic.guard.js';

export const requirePermissions = createGuardHelper<Permission>(RequestScopedPermissionsGuard);
/**
 * Route-scoped permission guard.
 */
export const requirePermissionsSngl = createGuardHelper<Permission>(RouteScopedPermissionsGuard);

export const basicAuth = createGuardHelper<string>(RequestScopedBasicGuard);
