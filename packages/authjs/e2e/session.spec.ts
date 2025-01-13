import { vi, describe, it, expect, afterAll, beforeAll } from 'vitest';
import supertest from 'supertest';
import { Status, rootModule } from '@ditsmod/core';
import { route, controller, RoutingModule, Req, HttpServer } from '@ditsmod/routing';
import { TestApplication } from '@ditsmod/testing';

const sessionJson = {
  user: {
    name: 'John Doe',
    email: 'test@example.com',
    image: '',
    id: '1234',
  },
  expires: '',
};

vi.mock('@auth/core', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@auth/core')>();
  return {
    ...mod,
    Auth: vi.fn((request, config) => {
      return new Response(JSON.stringify(sessionJson), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  };
});

// dynamic import to avoid loading Auth before hoisting
const { getSession } = await import('#mod/get-session.js');

const expectation = vi.fn((data?: any) => data);

@controller()
export class Controller1 {
  @route('GET')
  async getAuth(req: Req) {
    const session = await getSession(req, {
      providers: [],
      secret: 'secret',
    });

    expectation(session);

    return 'OK';
  }
}

@rootModule({
  imports: [RoutingModule],
  controllers: [Controller1],
})
export class AppModule {}

describe('getSession', () => {
  let server: HttpServer | undefined;
  let client: ReturnType<typeof supertest>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    client = supertest(server);
  });

  afterAll(async () => server?.close());

  it('Should return the mocked session from the Auth response', async () => {
    const { status } = await client.get('/').set('X-Test-Header', 'foo').set('Accept', 'application/json');

    expect(status).toBe(Status.OK);
    expect(expectation).lastCalledWith(sessionJson);
  });
});
