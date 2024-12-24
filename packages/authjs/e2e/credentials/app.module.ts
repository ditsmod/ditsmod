import { controller, rootModule, Providers, inject, OnModuleInit } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';
import type { AuthConfig } from '@auth/core';
import credentials from '@auth/core/providers/credentials';
import { vi } from 'vitest';

import { AuthjsModule } from '#mod/authjs.module.js';
import { AUTHJS_CONFIG, AUTHJS_SESSION } from '#mod/constants.js';
import { AuthjsGuard } from '#mod/auth.guard.js';
import { CredentialsService } from './credentials.service.js';

export const expectation = vi.fn((userName?: string | null) => userName);

@controller()
export class SingletonController {
  @route('POST', 'test', [AuthjsGuard])
  async getAuth(@inject(AUTHJS_SESSION) session: any) {
    expectation(session?.user?.name);
    return session;
  }
}

@rootModule({
  imports: [RoutingModule, { absolutePath: 'auth', module: AuthjsModule }],
  controllers: [SingletonController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
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
    this.authConfig.secret ??= 'secret';
    this.authConfig.providers ??= [];
    this.authConfig.providers.push(credentialsProvider);
  }
}
