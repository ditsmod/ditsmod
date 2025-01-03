import request from 'supertest';
import { HttpServer, Status } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { AppModule } from '#app/app.module.js';

describe('01-hello-world', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  function extractCookieValue(cookieHeader: string | string[], name: string) {
    const cookieStringFull = Array.isArray(cookieHeader)
      ? cookieHeader.find((header) => header.includes(name))
      : cookieHeader;
    return name + cookieStringFull?.split(name)[1].split(';')[0];
  }

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it.only('case1', async () => {
    const response = await testAgent.get('/auth/csrf');
    expect(response.status).toBe(200);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({ csrfToken: expect.any(String) });
    expect(response.headers['set-cookie']).toEqual(expect.any(Array));

    await expect(testAgent.get('/per-req')).resolves.toMatchObject({ status: Status.UNAUTHORIZED });

    const csrfTokenCookie = extractCookieValue(response.headers['set-cookie'], 'authjs.csrf-token');
    const callbackCookie = extractCookieValue(response.headers['set-cookie'], 'authjs.callback-url');
    const csrfTokenValue = csrfTokenCookie.split('%')[0].split('=')[1];

    // Sign in
    const responseCredentials = await testAgent
      .post('/auth/callback/credentials')
      .set('Cookie', [csrfTokenCookie, callbackCookie]) // Send the cookie with the request
      .send({ csrfToken: csrfTokenValue, username: 'johnsmith', email: 'johnsmith@i.ua', iAgree: true });

    expect(responseCredentials.status).toBe(Status.OK);
    expect(responseCredentials.text).toBe('ok');

    // Parse cookie for session token
    const sessionTokenCookie = extractCookieValue(responseCredentials.headers['set-cookie'], 'authjs.session-token');

    // Call test route
    const { status, body } = await testAgent.get('/per-req').set('Cookie', [sessionTokenCookie]);

    expect(status).toBe(Status.OK);
    console.log('body:', body);
    expect(body).toEqual({
      name: expect.any(String),
      email: expect.any(String),
    });
  });

  it('case3', async () => {
    const { status } = await testAgent.get('/per-rou');
    expect(status).toBe(401);
  });
});
