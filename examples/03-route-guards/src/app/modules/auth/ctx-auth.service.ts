import { RequestContext, injectable } from '@ditsmod/core';

import { Permission } from './types.js';

@injectable()
export class CtxAuthService {
  /**
   * Here you need implement more logic.
   */
  async hasPermissions(ctx: RequestContext, permissions?: Permission[]) {
    const currentUser = { permissions: [Permission.canActivateSomeResource] };

    return permissions?.every((permission) => currentUser.permissions.includes(permission));
  }
}
