import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { rootModule } from '@ditsmod/core';
import { controller, route, RoutingModule, applyResponse, Res, HttpServer } from '@ditsmod/routing';
import { TestApplication } from '@ditsmod/testing';

let webResponse: Response = new Response();

@controller()
export class Controller1 {
  @route('GET')
  async getAuth(res: Res) {
    const headers = new Headers();
    headers.append('X-Test-Header', 'foo');
    headers.append('Content-Type', 'application/json');

    webResponse = new Response(JSON.stringify({ name: 'Rexford' }), {
      headers: headers,
      status: 200,
    });
    await applyResponse(webResponse, res.rawRes);
  }
}

@rootModule({
  imports: [RoutingModule],
  controllers: [Controller1],
})
export class AppModule {}

function expectMatchingResponseHeaders(response: Response, res: supertest.Response) {
  for (const [headerName] of response.headers) {
    expect(response.headers.get(headerName)).toEqual(res.headers[headerName.toLowerCase()]);
  }
}

describe('toWebResponse', () => {
  let server: HttpServer | undefined;
  let client: ReturnType<typeof supertest>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    client = supertest(server);
  });

  afterAll(async () => server?.close());

  it('adapts response', async () => {
    const res = await client.get('/');

    expectMatchingResponseHeaders(webResponse, res);
    expect(res.body).toEqual({ name: 'Rexford' });
  });
});
