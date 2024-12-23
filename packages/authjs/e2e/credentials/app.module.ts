import { SingletonRequestContext, controller, rootModule, Providers } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';
import Credentials from '@auth/core/providers/credentials';
import type { AuthConfig } from '@auth/core';
import { vi } from 'vitest';

import { getSession } from '#mod/get-session.js';
import { AuthjsModule } from '#mod/authjs.module.js';

export const expectation = vi.fn((userName?: string | null) => userName);

const authConfig = {
  secret: 'secret',
  providers: [
    Credentials({
      credentials: { username: { label: 'Username' } },
      async authorize(credentials) {
        if (typeof credentials?.username == 'string') {
          const { username: name } = credentials;
          return { name: name, email: name.replace(' ', '') + '@example.com' };
        }
        return null;
      },
    }),
  ],
} satisfies AuthConfig;

@controller({ scope: 'module' })
export class SingletonController {
  @route('POST', 'test')
  async getAuth(ctx: SingletonRequestContext) {
    const session = await getSession(ctx, authConfig);
    expectation(session?.user?.name);
    return 'OK';
  }
}

@rootModule({
  imports: [RoutingModule, AuthjsModule.withParams('auth', authConfig)],
  controllers: [SingletonController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
