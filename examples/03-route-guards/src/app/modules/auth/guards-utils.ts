import { createHelperForGuardWithParams } from '@ditsmod/core';

import { PermissionsGuard } from './permissions.guard.js';
import { Permission } from './types.js';
import { CtxPermissionsGuard } from './ctx-permissions.guard.js';
import { BasicGuard } from './basic.guard.js';

export const requirePermissions = createHelperForGuardWithParams<Permission>(PermissionsGuard);
/**
 * Context-scoped permission guard.
 */
export const requirePermissionsSngl = createHelperForGuardWithParams<Permission>(CtxPermissionsGuard);

export const basicAuth = createHelperForGuardWithParams<string>(BasicGuard);
