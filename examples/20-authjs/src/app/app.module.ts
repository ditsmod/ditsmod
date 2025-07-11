import { controller, route, RestModule, Res, addRest } from '@ditsmod/rest';
import { AuthjsConfig, AUTHJS_SESSION, AuthjsGuard, AuthjsModule, AuthjsInterceptor } from '@ditsmod/authjs';
import { rootModule, inject } from '@ditsmod/core';

import { OverriddenAuthConfig } from './authjs.config.js';

@controller()
export class InjScopedController {
  @route('POST', 'auth/:action/:providerId', [], [AuthjsInterceptor])
  auth() {
    return 'ok';
  }

  @route('GET', 'per-req', [AuthjsGuard])
  getSession(@inject(AUTHJS_SESSION) session: any) {
    return session.user;
  }

  @route('GET')
  goto(res: Res) {
    res.rawRes.setHeader('content-type', 'text/html');
    const url = 'http://0.0.0.0:3000/auth/signin';
    return `Open your browser on <a href="${url}">${url}</a>`;
  }
}

@addRest({ controllers: [InjScopedController] })
@rootModule({
  imports: [
    RestModule,
    AuthjsModule.withConfig({
      token: AuthjsConfig,
      useFactory: [OverriddenAuthConfig, OverriddenAuthConfig.prototype.initAuthjsConfig],
    }),
  ],
})
export class AppModule {}
