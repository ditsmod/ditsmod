import { route, RoutingModule } from '@ditsmod/routing';
import { AUTHJS_CONFIG, AuthjsModule } from '@ditsmod/authjs';
import { controller, rootModule, Providers, inject, OnModuleInit } from '@ditsmod/core';
import type { AuthConfig } from '@auth/core';
import credentials from '@auth/core/providers/credentials';

@controller()
export class DefaultController {
  @route('GET', 'hello')
  tellHello() {
    return 'Hello, World!';
  }
}

@rootModule({
  imports: [RoutingModule, { absolutePath: 'auth', module: AuthjsModule }],
  controllers: [DefaultController],
  providersPerApp: new Providers().useLogConfig({ level: 'info', showExternalLogs: true }),
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
    this.authConfig.providers ??= [];
    this.authConfig.providers.push(credentialsProvider);
  }
}
