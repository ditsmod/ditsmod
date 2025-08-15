import { rootModule, inject } from '@ditsmod/core';
import { controller, route, RestModule, RequestContext, initRest } from '@ditsmod/rest';

import { AuthjsModule } from '#mod/authjs.module.js';
import { AUTHJS_SESSION } from '#mod/constants.js';
import { AuthjsGuard } from '#mod/authjs.guard.js';
import { AuthjsConfig } from '#mod/authjs.config.js';
import { OverriddenAuthConfig } from './authjs.config.js';
import { AuthjsInterceptor } from '#mod/authjs.interceptor.js';

@controller()
export class InjScopedController {
  @route('POST', 'auth/:action/:providerType', [], [AuthjsInterceptor])
  async method1() {
    return 'ok';
  }

  @route('GET', 'inj-scoped', [AuthjsGuard])
  async method2(@inject(AUTHJS_SESSION) session: any) {
    return session;
  }
}

@controller({ scope: 'ctx' })
export class CtxScopedController {
  @route('GET', 'ctx-scoped', [AuthjsGuard])
  async method1(ctx: RequestContext) {
    return ctx.auth;
  }
}

@initRest({
  imports: [
    RestModule,
    AuthjsModule.withConfig({
      token: AuthjsConfig,
      useFactory: [OverriddenAuthConfig, OverriddenAuthConfig.prototype.initAuthjsConfig],
    }),
  ],
  controllers: [InjScopedController, CtxScopedController],
})
@rootModule()
export class AppModule {}
