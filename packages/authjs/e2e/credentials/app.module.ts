import { controller, rootModule, inject, OnModuleInit } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';
import type { AuthConfig } from '@auth/core';
import { vi } from 'vitest';

import credentials from '#mod/providers/credentials.js';
import { AuthjsModule } from '#mod/authjs.module.js';
import { AUTHJS_CONFIG, AUTHJS_SESSION } from '#mod/constants.js';
import { AuthjsGuard } from '#mod/authjs.guard.js';
import { CredentialsService } from './credentials.service.js';

export const expectation = vi.fn((userName?: string | null) => userName);

@controller()
export class Controller1 {
  @route('GET', 'auth/:action')
  @route('POST', 'auth/:action/:providerType')
  async customAuthCsrf() {
    return 'ok';
  }

  @route('GET', 'test', [AuthjsGuard])
  async getAuth(@inject(AUTHJS_SESSION) session: any) {
    expectation(session?.user?.name);
    return session;
  }
}

@rootModule({
  imports: [RoutingModule, { absolutePath: 'auth', module: AuthjsModule }],
  controllers: [Controller1],
  providersPerMod: [CredentialsService],
})
export class AppModule implements OnModuleInit {
  constructor(
    @inject(AUTHJS_CONFIG) protected authConfig: AuthConfig,
    protected credentialsService: CredentialsService,
  ) {}

  onModuleInit() {
    const credentialsProvider = credentials({
      credentials: this.credentialsService.credentials,
      authorize: (data) => this.credentialsService.authorize(data),
    });
    this.authConfig.basePath ??= '/auth';
    this.authConfig.secret ??= 'secret';
    this.authConfig.providers ??= [];
    this.authConfig.providers.push(credentialsProvider);
  }
}
