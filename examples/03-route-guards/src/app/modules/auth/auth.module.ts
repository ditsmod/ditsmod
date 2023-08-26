import { featureModule } from '@ditsmod/core';

import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { PermissionsGuard } from './permissions.guard.js';

@featureModule({
  providersPerReq: [AuthGuard, PermissionsGuard, AuthService],
  exports: [AuthGuard, PermissionsGuard],
})
export class AuthModule {}
