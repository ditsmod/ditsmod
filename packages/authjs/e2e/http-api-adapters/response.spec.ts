import supertest from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { controller, route, applyResponse, RequestContext, HttpServer, restRootModule } from '@ditsmod/rest';
import { TestRestApplication } from '@ditsmod/rest-testing';

let webResponse: Response = new Response();

@controller()
export class Controller1 {
  @route('GET')
  async getAuth(ctx: RequestContext) {
    const headers = new Headers();
    headers.append('X-Test-Header', 'foo');
    headers.append('Content-Type', 'application/json');

    webResponse = new Response(JSON.stringify({ name: 'Rexford' }), {
      headers: headers,
      status: 200,
    });
    await applyResponse(webResponse, ctx.rawRes);
  }
}

@restRootModule({ controllers: [Controller1] })
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
    server = await TestRestApplication.createTestApp(AppModule).getServer();
    client = supertest(server);
  });

  afterAll(async () => server?.close());

  it('adapts response', async () => {
    const res = await client.get('/');

    expectMatchingResponseHeaders(webResponse, res);
    expect(res.body).toEqual({ name: 'Rexford' });
  });
});
