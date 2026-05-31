import { ctx } from '@ditsmod/core';
import { controller, route, RequestContext, restRootModule } from '@ditsmod/rest';

import { AuthjsModule } from '#mod/authjs.module.js';
import { AUTHJS_SESSION } from '#mod/constants.js';
import { AuthjsGuard } from '#mod/authjs.guard.js';
import { AuthjsConfig } from '#mod/authjs.config.js';
import { OverriddenAuthConfig } from './authjs.config.js';
import { AuthjsInterceptor } from '#mod/authjs.interceptor.js';

@controller()
export class RequestScopedController {
  @route('POST', 'auth/:action/:providerType', [], [AuthjsInterceptor])
  async method1() {
    return 'ok';
  }

  @route('GET', 'request-scoped', [AuthjsGuard])
  async method2(@ctx(AUTHJS_SESSION) session: any) {
    return session;
  }
}

@controller({ scope: 'route' })
export class RouteScopedController {
  @route('GET', 'route-scoped', [AuthjsGuard])
  async method1(reqCtx: RequestContext) {
    return reqCtx.auth;
  }
}

@restRootModule({
  imports: [
    AuthjsModule.withConfig({
      token: AuthjsConfig,
      useFactory: [OverriddenAuthConfig, OverriddenAuthConfig.prototype.initAuthjsConfig],
    }),
  ],
  controllers: [RequestScopedController, RouteScopedController],
})
export class AppModule {}
