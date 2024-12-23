import { describe, beforeEach, it, expect } from 'vitest';
import supertest from 'supertest';
import Credentials from '@auth/core/providers/credentials';
import type { AuthConfig } from '@auth/core';
import { AnyFn, HttpServer, SingletonRequestContext, Status } from '@ditsmod/core';
import { controller, rootModule, Providers } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';
import { TestApplication } from '@ditsmod/testing';

import { getSession } from '#mod/get-session.js';
import { AuthjsModule } from '#mod/authjs.module.js';

describe('Integration test with login and getSession', () => {
  let server: HttpServer;
  let client: ReturnType<typeof supertest>;
  let expectations: AnyFn<void | Promise<void>> = () => {};

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

  @controller()
  class DefaultController {
    @route('POST', 'default-controller')
    checkAuth() {
      return 'Hello, World!';
    }
  }

  @controller({ scope: 'module' })
  class SingletonController {
    @route('POST', 'test')
    async getAuth(ctx: SingletonRequestContext) {
      const session = await getSession(ctx, authConfig);
      expectations = async () => {
        expect(session?.user?.name).toEqual('johnsmith');
      };

      return 'OK';
    }
  }

  @rootModule({
    imports: [RoutingModule, AuthjsModule.withParams('auth', authConfig)],
    controllers: [DefaultController, SingletonController],
    providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  })
  class AppModule {}

  const extractCookieValue = (cookieHeader: string | string[], name: string) => {
    const cookieStringFull = Array.isArray(cookieHeader)
      ? cookieHeader.find((header) => header.includes(name))
      : cookieHeader;
    return name + cookieStringFull?.split(name)[1].split(';')[0];
  };

  beforeEach(async () => {
    server = await TestApplication.createTestApp(AppModule, {
      loggerConfig: { level: 'info' },
    }).getServer();
    client = supertest(server);
  });

  it('Should return the session with username after logging in', async () => {
    // Get signin page
    const response = await client.get('/auth/signin').set('X-Test-Header', 'foo').set('Accept', 'application/json');

    // Parse cookies for csrf token and callback url
    const csrfTokenCookie = extractCookieValue(response.headers['set-cookie'], 'authjs.csrf-token');
    const callbackCookie = extractCookieValue(response.headers['set-cookie'], 'authjs.callback-url');
    const csrfTokenValue = csrfTokenCookie.split('%')[0].split('=')[1];

    // Sign in
    const responseCredentials = await client
      .post('/auth/callback/credentials')
      .set('Cookie', [csrfTokenCookie, callbackCookie]) // Send the cookie with the request
      .send({ csrfToken: csrfTokenValue, username: 'johnsmith' });

    // Parse cookie for session token
    const sessionTokenCookie = extractCookieValue(responseCredentials.headers['set-cookie'], 'authjs.session-token');

    // Call test route
    const { status } = await client
      .post('/test')
      .set('X-Test-Header', 'foo')
      .set('Accept', 'application/json')
      .set('Cookie', [sessionTokenCookie]);

    expect(status).toBe(Status.OK);

    await expectations();
  });
});
