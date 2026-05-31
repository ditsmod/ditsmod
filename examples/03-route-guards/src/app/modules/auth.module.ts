import { restModule } from '@ditsmod/rest';

import { RequestScopedBearerGuard, RouteScopedBearerGuard } from './auth/bearer.guard.js';
import { AuthService } from './auth/auth.service.js';
import { RequestScopedPermissionsGuard } from './auth/permissions.guard.js';
import { RouteScopedAuthService } from './auth/ctx-auth.service.js';
import { RouteScopedPermissionsGuard } from './auth/ctx-permissions.guard.js';
import { RequestScopedBasicGuard } from './auth/basic.guard.js';

@restModule({
  // This array allows the tokens to be used for context scoped routes.
  providersPerRou: [
    RouteScopedAuthService,
    RouteScopedPermissionsGuard,
    RequestScopedBasicGuard,
    { token: RequestScopedBearerGuard, useClass: RouteScopedBearerGuard },
    RequestScopedPermissionsGuard,
    AuthService,
  ],

  // This array allows the tokens to be used for request scoped routes.
  providersPerReq: [RequestScopedBearerGuard, RequestScopedBasicGuard, RequestScopedPermissionsGuard],
  exports: [
    RequestScopedBasicGuard,
    RequestScopedBearerGuard,
    RequestScopedPermissionsGuard,
    RouteScopedPermissionsGuard,
  ],
})
export class AuthModule {}
