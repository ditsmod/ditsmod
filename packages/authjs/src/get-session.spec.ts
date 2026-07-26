import { jest } from '@jest/globals';
import type * as AuthCore from '@auth/core';
import { AuthjsConfig } from './authjs.config.js';
import type { ReqForSession } from './types.js';

let mockAuthResponse: Response;

jest.unstable_mockModule('@auth/core', async () => {
  const mod = await jest.requireActual<typeof AuthCore>('@auth/core');
  return {
    ...mod,
    Auth: jest.fn(async () => mockAuthResponse),
  };
});

const { getSession } = await import('./get-session.js');

describe('getSession', () => {
  let config: AuthjsConfig;
  let req: ReqForSession;

  beforeEach(() => {
    config = new AuthjsConfig();
    req = {
      protocol: 'http',
      rawReq: {
        headers: { cookie: 'authjs.session-token=123' },
      } as any,
    };
  });

  it('returns null if response JSON is empty object', async () => {
    mockAuthResponse = new Response(JSON.stringify({}), { status: 200 });
    const session = await getSession(req, config);
    expect(session).toBeNull();
  });

  it('returns null if response JSON is null/falsy', async () => {
    mockAuthResponse = new Response(JSON.stringify(null), { status: 200 });
    const session = await getSession(req, config);
    expect(session).toBeNull();
  });

  it('returns session data when status is 200 and data exists', async () => {
    const sessionData = { user: { name: 'Alice' }, expires: '2030-01-01' };
    mockAuthResponse = new Response(JSON.stringify(sessionData), { status: 200 });
    const session = await getSession(req, config);
    expect(session).toEqual(sessionData);
  });

  it('throws Error with data.message when status is not 200', async () => {
    const errorData = { message: 'Unauthorized access' };
    mockAuthResponse = new Response(JSON.stringify(errorData), { status: 401 });
    await expect(getSession(req, config)).rejects.toThrow('Unauthorized access');
  });
});
