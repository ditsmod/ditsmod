import { Class } from '@ditsmod/core';
import { TrpcCanActivate } from '#interceptors/trpc-guard.js';

/**
 * This factory creates a helper that makes it easier to work with guards that have parameters.
 * 
 * ### An example of creating a helper
 * 
```ts
import { createHelperForGuardWithParams } from '@ditsmod/trpc';

import { Permission } from './types.js';

export const requirePermissions = createHelperForGuardWithParams<Permission>(PermissionsGuard);
```
 * 
 * ### Usage
 * 
```ts
import { trpcController, trpcRoute } from '@ditsmod/trpc';

import { requirePermissions } from '../auth/guards-utils.js';
import { Permission } from '../auth/types.js';

@trpcController()
export class SomeController {
  @trpcRoute([requirePermissions(Permission.canActivateAdministration)])
  helloAdmin(res: Res) {
    res.send('some secret');
  }
}
```
 */
export function createHelperForGuardWithParams<T>(Guard: Class<TrpcCanActivate>): HelperForGuardWithParams<T> {
  return function requireArgs(...args: [T, ...T[]]): [Class<TrpcCanActivate>, T, ...T[]] {
    return [Guard, ...args];
  };
}

export interface HelperForGuardWithParams<T> {
  (...args: [T, ...T[]]): [Class<TrpcCanActivate>, T, ...T[]];
}
