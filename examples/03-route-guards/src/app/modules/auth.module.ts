import { restModule } from '@ditsmod/rest';

import { BearerGuard, BearerCtxGuard } from './auth/bearer.guard.js';
import { AuthService } from './auth/auth.service.js';
import { PermissionsGuard } from './auth/permissions.guard.js';
import { CtxAuthService } from './auth/ctx-auth.service.js';
import { CtxPermissionsGuard } from './auth/ctx-permissions.guard.js';
import { BasicGuard } from './auth/basic.guard.js';

@restModule({
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
  providersPerReq: [BearerGuard, BasicGuard, PermissionsGuard],
  exports: [BasicGuard, BearerGuard, PermissionsGuard, CtxPermissionsGuard],
})
export class AuthModule {}
