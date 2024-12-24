import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { controller, rootModule, HttpServer, Res } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';
import { TestApplication } from '@ditsmod/testing';

import { toDitsmodResponse } from '#mod/http-api-adapters.js';

let webResponse: Response = new Response();

@controller()
export class SingletonController {
  @route('POST')
  async getAuth(res: Res) {
    const headers = new Headers();
    headers.append('X-Test-Header', 'foo');
    headers.append('Content-Type', 'application/json');

    webResponse = new Response(JSON.stringify({ name: 'Rexford' }), {
      headers: headers,
      status: 200,
    });
    await toDitsmodResponse(webResponse, res.rawRes);
  }
}

@rootModule({
  imports: [RoutingModule],
  controllers: [SingletonController],
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
    const res = await client.post('/');

    expectMatchingResponseHeaders(webResponse, res);
    expect(res.body).toEqual({ name: 'Rexford' });
  });
});
