import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import type { AuthConfig } from '@auth/core';
import { rootModule, HttpServer, inject, OnModuleInit, injectable, RequestContext } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';
import { TestApplication } from '@ditsmod/testing';

import credentials from '#mod/providers/credentials.js';
import { AuthjsModule } from '#mod/authjs.module.js';
import { AUTHJS_CONFIG } from '#mod/constants.js';

// mock the toWebRequest, make it throw if "X-Test-Header" = 'throw'
vi.mock('#mod/http-api-adapters.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('#mod/http-api-adapters.js')>();
  return {
    ...mod,
    toWebRequest: vi.fn((ctx: RequestContext) => {
      if (ctx.rawReq.headers['x-test-header'] == 'throw') {
        throw new Error('Test error');
      }
      return mod.toWebRequest(ctx);
    }),
  };
});

@injectable()
export class CredentialsService {
  async authorize(credentials: Partial<Record<'username', unknown>>) {
    if (typeof credentials?.username === 'string') {
      const { username: name } = credentials;
      return { name: name, email: name.replace(' ', '') + '@example.com' };
    }
    return null;
  }
}

@rootModule({
  imports: [RoutingModule, { absolutePath: 'auth', module: AuthjsModule }],
  providersPerMod: [CredentialsService],
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

describe('Middleware behaviour', () => {
  let server: HttpServer | undefined;
  let client: ReturnType<typeof supertest>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    client = supertest(server);
  });

  afterAll(async () => server?.close());

  it('Should sent response only once', async () => {
    const { status } = await client.get('/auth/session').set('Accept', 'application/json');
    expect(status).toBe(200);
  });

  it('Should send status 500 if there is an error thrown in the auth middleware', async () => {
    // send header that causes mock to throw
    const { status } = await client
      .get('/auth/session')
      .set('Accept', 'application/json')
      .set('X-Test-Header', 'throw');

    expect(status).toBe(500);
  });
});
