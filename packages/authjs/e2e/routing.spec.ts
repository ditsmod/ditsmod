import { jest } from '@jest/globals';
import supertest from 'supertest';
import { route, RequestContext, controller, HttpServer, restRootModule } from '@ditsmod/rest';
import { TestRestApplication } from '@ditsmod/rest-testing';

import type * as HttpApiAdapters from '#mod/http-api-adapters.js';

// mock the toWebRequest, make it throw if "X-Test-Header" = 'throw'
jest.unstable_mockModule('#mod/http-api-adapters.js', async () => {
  const mod = await jest.requireActual<typeof HttpApiAdapters>('#mod/http-api-adapters.js');
  return {
    ...mod,
    toWebRequest: jest.fn((ctx: RequestContext) => {
      if (ctx.rawReq.headers['x-test-header'] == 'throw') {
        throw new Error('Test error');
      }
      return mod.toWebRequest(ctx);
    }),
  };
});

const credentials = (await import('#mod/providers/credentials.js')).default;
const { AuthjsModule } = await import('#mod/authjs.module.js');
const { AuthjsInterceptor } = await import('#mod/authjs.interceptor.js');

@controller()
export class Controller1 {
  @route('POST', 'auth/:action/:providerType', [], [AuthjsInterceptor])
  async getAuth() {
    return 'OK';
  }
}

@restRootModule({
  imports: [AuthjsModule.withConfig({ secret: 'secret', providers: [credentials] })],
  controllers: [Controller1],
})
export class AppModule {}

describe('Middleware behaviour', () => {
  let server: HttpServer | undefined;
  let client: ReturnType<typeof supertest>;

  beforeAll(async () => {
    server = await TestRestApplication.createTestApp(AppModule).getServer();
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
