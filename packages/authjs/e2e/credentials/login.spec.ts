import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { HttpServer, Status } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule, expectation } from './app.module.js';

describe('Integration test with login and getSession', () => {
  let server: HttpServer | undefined;
  let client: ReturnType<typeof supertest>;

  function extractCookieValue(cookieHeader: string | string[], name: string) {
    const cookieStringFull = Array.isArray(cookieHeader)
      ? cookieHeader.find((header) => header.includes(name))
      : cookieHeader;
    return name + cookieStringFull?.split(name)[1].split(';')[0];
  }

  beforeAll(async () => {
    server = await TestApplication.createTestApp(AppModule).getServer();
    client = supertest(server);
  });

  afterAll(async () => server?.close());

  it('Should return the session with username after logging in', async () => {
    // Get cookies with csrf
    const response = await client.get('/auth/csrf').set('X-Test-Header', 'foo').set('Accept', 'application/json');

    // Parse cookies for csrf token and callback url
    const csrfTokenCookie = extractCookieValue(response.headers['set-cookie'], 'authjs.csrf-token');
    const callbackCookie = extractCookieValue(response.headers['set-cookie'], 'authjs.callback-url');
    const csrfTokenValue = csrfTokenCookie.split('%')[0].split('=')[1];

    // Sign in
    const responseCredentials = await client
      .post('/auth/callback/credentials')
      .set('Cookie', [csrfTokenCookie, callbackCookie]) // Send the cookie with the request
      .send({ csrfToken: csrfTokenValue, username: 'johnsmith' });

      expect(responseCredentials.status).toBe(Status.OK);
      expect(responseCredentials.text).toBe('ok');

    // Parse cookie for session token
    const sessionTokenCookie = extractCookieValue(responseCredentials.headers['set-cookie'], 'authjs.session-token');

    // Call test route
    const { status } = await client
      .get('/test')
      .set('X-Test-Header', 'foo')
      .set('Accept', 'application/json')
      .set('Cookie', [sessionTokenCookie]);

    expect(status).toBe(Status.OK);
    expect(expectation).lastCalledWith('johnsmith');
  });
});
