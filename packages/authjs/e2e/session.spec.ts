import { jest } from '@jest/globals';
import supertest from 'supertest';
import { HttpStatus } from '@holu/core';
import { route, controller, HttpServer, restRootModule, RequestContext } from '@holu/rest';
import { TestRestApplication } from '@holu/rest-testing';

import type * as AuthCore from '@auth/core';

const sessionJson = {
  user: {
    name: 'John Doe',
    email: 'test@example.com',
    image: '',
    id: '1234',
  },
  expires: '',
};

jest.unstable_mockModule('@auth/core', async () => {
  const mod = await jest.requireActual<typeof AuthCore>('@auth/core');
  return {
    ...mod,
    Auth: jest.fn((request: any, config: any) => {
      return new Response(JSON.stringify(sessionJson), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  };
});

// dynamic import to avoid loading Auth before hoisting
const { getSession } = await import('#mod/get-session.js');

const expectation = jest.fn((data?: any) => data);

@controller()
export class Controller1 {
  @route('GET')
  async getAuth(ctx: RequestContext) {
    const session = await getSession(ctx, {
      providers: [],
      secret: 'secret',
    });

    expectation(session);

    return 'OK';
  }
}

@restRootModule({ controllers: [Controller1] })
export class AppModule {}

describe('getSession', () => {
  let server: HttpServer | undefined;
  let client: ReturnType<typeof supertest>;

  beforeAll(async () => {
    server = await TestRestApplication.createTestApp(AppModule).getServer();
    client = supertest(server);
  });

  afterAll(async () => server?.close());

  it('Should return the mocked session from the Auth response', async () => {
    const { status } = await client.get('/').set('X-Test-Header', 'foo').set('Accept', 'application/json');

    expect(status).toBe(HttpStatus.OK);
    expect(expectation).toHaveBeenLastCalledWith(sessionJson);
  });
});
