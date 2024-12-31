import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { HttpServer, Status } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from './app.module.js';

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

  ['inj', 'ctx'].forEach((scope) => {
    it(`${scope}-scoped controller should return the session with username after logging in`, async () => {
      // Get cookies with csrf
      const response = await client.get('/auth/csrf').set('Accept', 'application/json');

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
      const expectedSession = { user: { name: expect.any(String), email: expect.any(String) } };

      // Call test route
      const { status, body } = await client.get(`/${scope}-scoped`).set('Cookie', [sessionTokenCookie]);

      expect(status).toBe(Status.OK);
      expect(body).toMatchObject(expectedSession);
    });
  });
});
