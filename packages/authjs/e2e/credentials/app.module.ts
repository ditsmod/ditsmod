import { controller, rootModule, Providers, inject, OnModuleInit } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';
import type { AuthConfig } from '@auth/core';
import credentials from '@auth/core/providers/credentials';
import { vi } from 'vitest';

import { AuthjsModule } from '#mod/authjs.module.js';
import { AUTHJS_CONFIG, AUTHJS_SESSION } from '#mod/constants.js';
import { AuthjsGuard } from '#mod/auth.guard.js';

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
})
export class AppModule implements OnModuleInit {
  constructor(@inject(AUTHJS_CONFIG) protected authConfig: AuthConfig) {}

  onModuleInit() {
    const credentialsProvider = credentials({
      credentials: { username: { label: 'Username' } },
      async authorize(user) {
        if (typeof user?.username == 'string') {
          const { username: name } = user;
          return { name: name, email: name.replace(' ', '') + '@example.com' };
        }
        return null;
      },
    });
    this.authConfig.basePath ??= '/auth';
    this.authConfig.secret ??= 'secret';
    this.authConfig.providers ??= [];
    this.authConfig.providers.push(credentialsProvider);
  }
}
