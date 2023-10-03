import { featureModule } from '@ditsmod/core';

import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { PermissionsGuard } from './permissions.guard.js';
import { SingletonAuthService } from './singleton-auth.service.js';
import { SingletonPermissionsGuard } from './singleton-permissions.guard.js';

@featureModule({
  providersPerRou: [SingletonAuthService, SingletonPermissionsGuard],
  providersPerReq: [AuthGuard, PermissionsGuard, AuthService],
  exports: [AuthGuard, PermissionsGuard, SingletonPermissionsGuard],
})
export class AuthModule {}
