import { route, RoutingModule } from '@ditsmod/routing';
import { AUTHJS_CONFIG, AUTHJS_SESSION, AuthjsGuard, AuthjsModule } from '@ditsmod/authjs';
import { controller, rootModule, Providers, inject, OnModuleInit, SingletonRequestContext } from '@ditsmod/core';
import type { AuthConfig } from '@auth/core';
import credentials from '@ditsmod/authjs/providers/credentials';

import { CredentialsService } from './credentials.service.js';

@controller()
export class PerReqController {
  @route('GET', 'per-req', [AuthjsGuard])
  tellHello(@inject(AUTHJS_SESSION) session: any) {
    return session;
  }
}

@controller({ scope: 'module' })
export class PerModController {
  @route('GET', 'per-mod', [AuthjsGuard])
  tellHello(ctx: SingletonRequestContext) {
    return ctx.auth;
  }
}

@rootModule({
  imports: [RoutingModule, { absolutePath: 'auth', module: AuthjsModule }],
  controllers: [PerReqController, PerModController],
  providersPerApp: new Providers().useLogConfig({ level: 'info', showExternalLogs: true }),
  providersPerMod: [CredentialsService]
})
export class AppModule implements OnModuleInit {
  constructor(
    @inject(AUTHJS_CONFIG) protected authConfig: AuthConfig,
    protected credentialsService: CredentialsService,
  ) {}

  onModuleInit() {
    const credentialsProvider = credentials({
      credentials: { username: { label: 'Username' } },
      authorize: (data) => this.credentialsService.authorize(data),
    });
    this.authConfig.basePath ??= '/auth';
    this.authConfig.providers ??= [];
    this.authConfig.providers.push(credentialsProvider);
  }
}
