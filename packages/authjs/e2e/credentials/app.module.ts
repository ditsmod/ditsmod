import { BODY_PARSER_EXTENSIONS } from '@ditsmod/body-parser';
import { controller, rootModule, inject, RequestContext } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';

import { AuthjsModule } from '#mod/authjs.module.js';
import { AUTHJS_SESSION } from '#mod/constants.js';
import { AuthjsGuard } from '#mod/authjs.guard.js';
import { AuthjsConfig } from '#mod/authjs.config.js';
import { OverriddenAuthConfig } from './authjs.config.js';
import { AuthjsInterceptor } from '#mod/authjs.interceptor.js';

@controller()
export class InjScopedController {
  @route('GET', 'auth/:action', [], [AuthjsInterceptor])
  @route('POST', 'auth/:action/:providerType', [], [BODY_PARSER_EXTENSIONS, AuthjsInterceptor])
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
  imports: [
    RoutingModule,
    AuthjsModule.withConfigProvider({
      token: AuthjsConfig,
      useFactory: [OverriddenAuthConfig, OverriddenAuthConfig.prototype.initAuthjsConfig],
    }),
  ],
  controllers: [InjScopedController, CtxScopedController],
})
export class AppModule {}
