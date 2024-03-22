import { featureModule } from '@ditsmod/core';

import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { PermissionsGuard } from './permissions.guard.js';
import { SingletonAuthService } from './singleton-auth.service.js';
import { SingletonPermissionsGuard } from './singleton-permissions.guard.js';
import { BasicGuard } from './basic.guard.js';

@featureModule({
  providersPerRou: [SingletonAuthService, SingletonPermissionsGuard],
  providersPerReq: [BasicGuard, AuthGuard, PermissionsGuard, AuthService],
  exports: [BasicGuard, AuthGuard, PermissionsGuard, SingletonPermissionsGuard],
})
export class AuthModule {}
