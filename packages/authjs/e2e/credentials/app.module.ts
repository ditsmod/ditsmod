import { SingletonRequestContext, controller, rootModule, Providers, inject } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';
import type { AuthConfig } from '@auth/core';
import credentials from '@auth/core/providers/credentials';
import { vi } from 'vitest';

import { getSession } from '#mod/get-session.js';
import { AuthjsModule } from '#mod/authjs.module.js';
import { AUTHJS_CONFIG } from '#mod/constants.js';

export const expectation = vi.fn((userName?: string | null) => userName);

@controller({ scope: 'module' })
export class SingletonController {
  constructor(@inject(AUTHJS_CONFIG) protected authConfig: AuthConfig) {}

  @route('POST', 'test')
  async getAuth(ctx: SingletonRequestContext) {
    const session = await getSession(ctx, this.authConfig);
    expectation(session?.user?.name);
    return 'OK';
  }
}

@rootModule({
  imports: [RoutingModule, { absolutePath: 'auth', module: AuthjsModule }],
  controllers: [SingletonController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {
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
    this.authConfig.secret ??= 'secret';
    this.authConfig.providers ??= [];
    this.authConfig.providers.push(credentialsProvider);
  }
}
