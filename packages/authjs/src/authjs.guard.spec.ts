import { jest } from '@jest/globals';
import { Context } from '@holu/core';
import type { RequestContext } from '@holu/rest';
import { AuthjsConfig } from './authjs.config.js';
import { AUTHJS_SESSION } from './constants.js';

import type * as AuthjsGuardType from './authjs.guard.js';

let mockSessionResult: any = null;

jest.unstable_mockModule('./get-session.js', () => ({
  getSession: jest.fn(async () => mockSessionResult),
}));

const { AuthjsGuard } = await import('./authjs.guard.js');

describe('AuthjsGuard', () => {
  let guard: AuthjsGuardType.AuthjsGuard;
  let config: AuthjsConfig;
  let holuCtx: Context;
  let reqCtx: RequestContext;

  beforeEach(() => {
    config = new AuthjsConfig();
    holuCtx = new Context();
    guard = new AuthjsGuard(config, holuCtx);
    reqCtx = {
      protocol: 'http',
      rawReq: { headers: {} },
    } as unknown as RequestContext;
  });

  it('returns false when getSession returns null', async () => {
    mockSessionResult = null;

    const result = await guard.canActivate(reqCtx);

    expect(result).toBe(false);
    expect(reqCtx.auth).toBeUndefined();
    expect(holuCtx.get(AUTHJS_SESSION)).toBeUndefined();
  });

  it('sets session on ctx and holuCtx and returns true when session exists', async () => {
    const fakeSession = { user: { name: 'John' }, expires: '2030-01-01' };
    mockSessionResult = fakeSession;

    const result = await guard.canActivate(reqCtx);

    expect(result).toBe(true);
    expect(reqCtx.auth).toEqual(fakeSession);
    expect(holuCtx.get(AUTHJS_SESSION)).toEqual(fakeSession);
  });
});
