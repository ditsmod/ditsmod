import { route, RoutingModule } from '@ditsmod/routing';
import { AuthjsConfig, AUTHJS_SESSION, AuthjsGuard, AuthjsModule, AuthjsInterceptor } from '@ditsmod/authjs';
import { controller, rootModule, inject, RequestContext } from '@ditsmod/core';
import { BODY_PARSER_EXTENSIONS } from '@ditsmod/body-parser';

import { OverriddenAuthConfig } from './authjs.config.js';

@controller()
export class InjScopedController {
  @route('GET')
  goto(ctx: RequestContext) {
    ctx.rawRes.setHeader('content-type', 'text/html');
    const url = 'http://0.0.0.0:3000/auth/signin';
    return `Open your browser on <a href="${url}">${url}</a>`;
  }

  @route('GET', 'auth/:action', [], [AuthjsInterceptor])
  @route('POST', 'auth/:action/:providerType', [], [BODY_PARSER_EXTENSIONS, AuthjsInterceptor])
  auth() {
    return 'ok';
  }

  @route('GET', 'per-req', [AuthjsGuard])
  getSession(@inject(AUTHJS_SESSION) session: any) {
    return session.user;
  }
}

@rootModule({
  imports: [
    RoutingModule,
    AuthjsModule.withConfig({
      token: AuthjsConfig,
      useFactory: [OverriddenAuthConfig, OverriddenAuthConfig.prototype.initAuthjsConfig],
    }),
  ],
  controllers: [InjScopedController],
})
export class AppModule {}
