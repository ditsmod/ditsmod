import { featureModule } from '@ditsmod/core';

import { BearerGuard } from './bearer.guard.js';
import { AuthService } from './auth.service.js';
import { PermissionsGuard } from './permissions.guard.js';
import { SingletonAuthService } from './singleton-auth.service.js';
import { SingletonPermissionsGuard } from './singleton-permissions.guard.js';
import { BasicGuard } from './basic.guard.js';

@featureModule({
  providersPerRou: [
    SingletonAuthService,
    SingletonPermissionsGuard,
    BasicGuard,
    BearerGuard,
    PermissionsGuard,
    AuthService,
  ],
  providersPerReq: [BasicGuard, BearerGuard, PermissionsGuard, AuthService],
  exports: [BasicGuard, BearerGuard, PermissionsGuard, SingletonPermissionsGuard],
})
export class AuthModule {}
