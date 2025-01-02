import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { rootModule, HttpServer, RequestContext, controller } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';
import { BODY_PARSER_EXTENSIONS } from '@ditsmod/body-parser';
import { TestApplication } from '@ditsmod/testing';

import credentials from '#mod/providers/credentials.js';
import { AuthjsModule } from '#mod/authjs.module.js';
import { AuthjsConfig } from '#mod/authjs.config.js';
import { AuthjsInterceptor } from '#mod/authjs.interceptor.js';

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

@controller()
export class Controller1 {
  @route('GET', 'auth/:action', [], [AuthjsInterceptor])
  @route('POST', 'auth/:action/:providerType', [], [BODY_PARSER_EXTENSIONS, AuthjsInterceptor])
  async getAuth() {
    return 'OK';
  }
}

@rootModule({
  imports: [
    RoutingModule,
    AuthjsModule.withConfigProvider({ secret: 'secret', providers: [credentials] }),
  ],
  controllers: [Controller1],
})
export class AppModule {}

describe('Middleware behaviour', () => {
  let server: HttpServer | undefined;
  let client: ReturnType<typeof supertest>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    client = supertest(server);
  });

  afterAll(async () => server?.close());

  it('should sent OK response', async () => {
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
