import { featureModule } from '@ditsmod/core';

import { BearerGuard, BearerCtxGuard } from './bearer.guard.js';
import { AuthService } from './auth.service.js';
import { PermissionsGuard } from './permissions.guard.js';
import { CtxAuthService } from './ctx-auth.service.js';
import { CtxPermissionsGuard } from './ctx-permissions.guard.js';
import { BasicGuard } from './basic.guard.js';

@featureModule({
  // This array allows the tokens to be used for context scoped routes.
  providersPerRou: [
    CtxAuthService,
    CtxPermissionsGuard,
    BasicGuard,
    { token: BearerGuard, useClass: BearerCtxGuard },
    PermissionsGuard,
    AuthService,
  ],

  // This array allows the tokens to be used for request scoped routes.
  providersPerReq: [
    BearerGuard,
    BasicGuard,
    PermissionsGuard,
  ],
  exports: [BasicGuard, BearerGuard, PermissionsGuard, CtxPermissionsGuard],
})
export class AuthModule {}
