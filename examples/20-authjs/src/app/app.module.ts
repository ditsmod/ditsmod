import { route, RoutingModule } from '@ditsmod/routing';
import { AuthjsConfig, AUTHJS_SESSION, AuthjsGuard, AuthjsModule, AuthjsInterceptor } from '@ditsmod/authjs';
import { controller, rootModule, inject, RequestContext } from '@ditsmod/core';
import { BODY_PARSER_EXTENSIONS } from '@ditsmod/body-parser';

import { OverriddenAuthConfig } from './authjs.config.js';

@controller()
export class InjScopedController {
  @route('GET', 'per-req', [AuthjsGuard])
  tellHello(@inject(AUTHJS_SESSION) session: any) {
    return session.user;
  }

  @route('GET', 'auth/:action', [], [AuthjsInterceptor])
  @route('POST', 'auth/:action/:providerType', [], [BODY_PARSER_EXTENSIONS, AuthjsInterceptor])
  auth() {
    return 'ok';
  }
}

@controller({ scope: 'ctx' })
export class CtxScopedController {
  @route('GET')
  goto(ctx: RequestContext) {
    ctx.rawRes.setHeader('content-type', 'text/html');
    const url = 'http://0.0.0.0:3000/auth/signin';
    return `Open your browser on <a href="${url}">${url}</a>`;
  }

  @route('GET', 'per-rou', [AuthjsGuard])
  tellHello(ctx: RequestContext) {
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
