import { route, RoutingModule } from '@ditsmod/routing';
import { AuthjsConfig, AUTHJS_CONFIG, AUTHJS_SESSION, AuthjsGuard, AuthjsModule } from '@ditsmod/authjs';
import { controller, rootModule, inject, OnModuleInit, RequestContext } from '@ditsmod/core';
import credentials from '@ditsmod/authjs/providers/credentials';

import { CredentialsService } from './credentials.service.js';

@controller()
export class InjScopedController {
  @route('GET', 'per-req', [AuthjsGuard])
  tellHello(@inject(AUTHJS_SESSION) session: any) {
    return session.user;
  }

  @route('GET', 'auth/:action')
  @route('POST', 'auth/:action/:providerType')
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
  imports: [RoutingModule, { absolutePath: 'auth', module: AuthjsModule }],
  controllers: [InjScopedController, CtxScopedController],
  providersPerMod: [CredentialsService],
})
export class AppModule implements OnModuleInit {
  constructor(
    @inject(AUTHJS_CONFIG) protected authConfig: AuthjsConfig,
    protected credentialsService: CredentialsService,
  ) {}

  onModuleInit() {
    const credentialsProvider = credentials({
      credentials: this.credentialsService.credentials,
      authorize: this.credentialsService.authorize,
    });
    this.authConfig.basePath ??= '/auth';
    this.authConfig.providers ??= [credentialsProvider];
  }
}
