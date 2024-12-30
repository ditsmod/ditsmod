import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { Status, controller, rootModule, HttpServer, RequestContext, RawRequest } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';
import { TestApplication } from '@ditsmod/testing';
import { BodyParserModule } from '@ditsmod/body-parser';

import { toWebRequest, encodeUrlEncoded } from '#mod/http-api-adapters.js';

@controller({ scope: 'ctx' })
export class Controller1 {
  @route('GET', 'case1')
  async case1(ctx: RequestContext) {
    const request = toWebRequest(ctx);
    expectMatchingRequestHeaders(ctx.rawReq, request);
    return 'OK';
  }

  @route('POST', 'case2')
  async case2(ctx: RequestContext) {
    const request = toWebRequest(ctx);
    await expectMatchingJsonRequestBody(ctx, request);
    return 'OK';
  }

  @route('POST', 'case3')
  async case3(ctx: RequestContext) {
    const request = toWebRequest(ctx);
    await expectMatchingUrlEncodedRequestBody(ctx, request);
    return 'OK';
  }
}

@rootModule({
  imports: [RoutingModule, BodyParserModule],
  controllers: [Controller1],
})
export class AppModule {}

function expectMatchingRequestHeaders(req: RawRequest, request: Request) {
  for (const headerName in req.headers) {
    expect(request.headers.get(headerName)).toEqual(req.headers[headerName]);
  }
}

async function expectMatchingJsonRequestBody(req: RequestContext, request: Request) {
  const body = await request.json();
  expect(body).toEqual(req.body);
}

async function expectMatchingUrlEncodedRequestBody(req: RequestContext, request: Request) {
  const body = await request.text();
  expect(body).toEqual(encodeUrlEncoded(req.body));
}

describe('toWebRequest', () => {
  let server: HttpServer | undefined;
  let client: ReturnType<typeof supertest>;

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    client = supertest(server);
  });

  afterAll(async () => server?.close());

  it('adapts request headers', async () => {
    const { status } = await client.get('/case1').set('X-Test-Header', 'foo').set('Accept', 'application/json');
    expect(status).toBe(Status.OK);
  });

  it('adapts request with json encoded body', async () => {
    const { status } = await client.post('/case2').set('Content-Type', 'application/json').send({ name: 'Rexford' });
    expect(status).toBe(Status.OK);
  });

  it('adapts request with url-encoded body', async () => {
    const data = {
      name: 'Rexford',
      nums: [1, 2, 3],
    };

    const { status } = await client
      .post('/case3')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(encodeUrlEncoded(data));

    expect(status).toBe(Status.OK);
  });
});
