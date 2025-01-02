import { controller, rootModule, inject, RequestContext } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';

import { AuthjsModule } from '#mod/authjs.module.js';
import { AUTHJS_SESSION } from '#mod/constants.js';
import { AuthjsGuard } from '#mod/authjs.guard.js';
import { AuthjsConfig } from '#mod/authjs.config.js';
import { OverriddenAuthConfig } from './authjs.config.js';

@controller()
export class InjScopedController {
  @route('GET', 'auth/:action')
  @route('POST', 'auth/:action/:providerType')
  async customAuthCsrf() {
    return 'ok';
  }

  @route('GET', 'inj-scoped', [AuthjsGuard])
  async getAuth(@inject(AUTHJS_SESSION) session: any) {
    return session;
  }
}

@controller({ scope: 'ctx' })
export class CtxScopedController {
  @route('GET', 'ctx-scoped', [AuthjsGuard])
  async getAuth(ctx: RequestContext) {
    return ctx.auth;
  }
}

@rootModule({
  imports: [RoutingModule, { absolutePath: 'auth', module: AuthjsModule }],
  controllers: [InjScopedController, CtxScopedController],
  providersPerMod: [
    { token: AuthjsConfig, useFactory: [OverriddenAuthConfig, OverriddenAuthConfig.prototype.initAuthjsConfig] },
  ],
})
export class AppModule {}
