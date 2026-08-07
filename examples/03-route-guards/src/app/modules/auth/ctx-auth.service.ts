import { injectable } from '@holu/core';
import { RequestContext } from '@holu/rest';

import { Permission } from './types.js';

@injectable()
export class RouteScopedAuthService {
  /**
   * Here you need implement more logic.
   */
  async hasPermissions(ctx: RequestContext, permissions?: Permission[]) {
    const currentUser = { permissions: [Permission.canActivateSomeResource] };

    return permissions?.every((permission) => currentUser.permissions.includes(permission));
  }
}
