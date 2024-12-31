import { controller, rootModule, inject, OnModuleInit, RequestContext } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';
import type { AuthConfig } from '@auth/core';

import credentials from '#mod/providers/credentials.js';
import { AuthjsModule } from '#mod/authjs.module.js';
import { AUTHJS_CONFIG, AUTHJS_SESSION } from '#mod/constants.js';
import { AuthjsGuard } from '#mod/authjs.guard.js';
import { CredentialsService } from './credentials.service.js';

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
  providersPerMod: [CredentialsService],
})
export class AppModule implements OnModuleInit {
  constructor(
    @inject(AUTHJS_CONFIG) protected authConfig: AuthConfig,
    protected credentialsService: CredentialsService,
  ) {}

  onModuleInit() {
    const credentialsProvider = credentials({
      authorize: (data) => this.credentialsService.authorize(data),
    });
    this.authConfig.secret ??= 'secret';
    this.authConfig.providers ??= [credentialsProvider];
  }
}
