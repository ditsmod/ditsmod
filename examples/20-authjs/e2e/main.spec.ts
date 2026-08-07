import request from 'supertest';
import { HttpStatus } from '@holu/core';
import type { HttpServer } from '@holu/rest';
import { TestRestApplication } from '@holu/rest-testing';

import { AppModule } from '#app/app.module.js';

describe('20-authjs', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  function extractCookieValue(cookieHeader: string | string[], name: string) {
    if (!cookieHeader) return undefined;
    const cookieStringFull = Array.isArray(cookieHeader)
      ? cookieHeader.find((header) => header.includes(name))
      : cookieHeader;
    if (!cookieStringFull) return undefined;
    return name + cookieStringFull.split(name)[1].split(';')[0];
  }

  beforeAll(async () => {
    server = await TestRestApplication.createTestApp(AppModule).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('demonstrates authentication flow, role claims, and guarded vs optional sessions', async () => {
    // 1. Verify home page navigation
    const homeRes = await testAgent.get('/');
    expect(homeRes.status).toBe(HttpStatus.OK);
    expect(homeRes.text).toContain('Holu Auth.js Example');

    // 2. Check public status before logging in
    const guestStatusRes = await testAgent.get('/status');
    expect(guestStatusRes.status).toBe(HttpStatus.OK);
    expect(guestStatusRes.body).toEqual({ status: 'guest', message: 'You are not logged in' });

    // 3. Attempt to access protected route without auth
    await expect(testAgent.get('/profile')).resolves.toMatchObject({ status: HttpStatus.UNAUTHORIZED });

    // 4. Get CSRF token and initial cookies
    const csrfRes = await testAgent.get('/auth/csrf');
    expect(csrfRes.status).toBe(200);
    expect(csrfRes.body).toEqual({ csrfToken: expect.any(String) });

    const csrfTokenCookie = extractCookieValue(csrfRes.headers['set-cookie'], 'authjs.csrf-token')!;
    const callbackCookie = extractCookieValue(csrfRes.headers['set-cookie'], 'authjs.callback-url')!;
    const csrfTokenValue = csrfTokenCookie.split('%')[0].split('=')[1];

    // 5. Attempt login with incorrect credentials
    const badLoginRes = await testAgent
      .post('/auth/callback/credentials')
      .set('Cookie', [csrfTokenCookie, callbackCookie])
      .send({ csrfToken: csrfTokenValue, username: 'johnsmith', password: 'wrongpassword' });

    expect(badLoginRes.status).toBe(HttpStatus.FOUND);
    expect(badLoginRes.headers.location).toContain('error=CredentialsSignin');
    const badSessionCookie = extractCookieValue(badLoginRes.headers['set-cookie'] || [], 'authjs.session-token');
    expect(badSessionCookie).toBeUndefined();

    // 5.1 Simulate browser HTML form login (application/x-www-form-urlencoded)
    const formLoginRes = await testAgent
      .post('/auth/callback/credentials')
      .type('form')
      .set('Cookie', [csrfTokenCookie, callbackCookie])
      .send({
        csrfToken: csrfTokenValue,
        username: 'johnsmith',
        password: 'password123',
        email: 'johnsmith@i.ua',
      });

    expect(formLoginRes.status).toBe(HttpStatus.FOUND);
    expect(formLoginRes.headers.location).toContain('/status');

    // 6. Sign in with valid credentials via JSON API (application/json)
    const loginRes = await testAgent
      .post('/auth/callback/credentials')
      .set('Cookie', [csrfTokenCookie, callbackCookie])
      .send({
        csrfToken: csrfTokenValue,
        username: 'johnsmith',
        password: 'password123',
        email: 'johnsmith@i.ua',
      });

    expect(loginRes.status).toBe(HttpStatus.OK);
    expect(loginRes.text).toBe('ok');

    const sessionTokenCookie = extractCookieValue(loginRes.headers['set-cookie'], 'authjs.session-token')!;
    expect(sessionTokenCookie).toBeDefined();

    // 7. Call protected profile route with valid session cookie
    const profileRes = await testAgent.get('/profile').set('Cookie', [sessionTokenCookie]);
    expect(profileRes.status).toBe(HttpStatus.OK);
    expect(profileRes.body).toEqual({
      name: 'johnsmith',
      email: 'johnsmith@i.ua',
      role: 'admin',
    });

    // 8. Call optional status route with valid session cookie
    const authStatusRes = await testAgent.get('/status').set('Cookie', [sessionTokenCookie]);
    expect(authStatusRes.status).toBe(HttpStatus.OK);
    expect(authStatusRes.body).toEqual({
      status: 'logged in',
      user: {
        name: 'johnsmith',
        email: 'johnsmith@i.ua',
        role: 'admin',
      },
    });

    // 9. Sign out
    const signoutRes = await testAgent
      .post('/auth/signout')
      .set('Cookie', [csrfTokenCookie, sessionTokenCookie])
      .send({ csrfToken: csrfTokenValue });

    expect(signoutRes.status).toBe(200);
    expect(signoutRes.headers['set-cookie']).toBeDefined();

    await expect(testAgent.get('/profile')).resolves.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
  });
});
