import { jest } from '@jest/globals';
import type { Injector } from '@holu/core';
import type { RequestContext } from '@holu/rest';
import { AuthjsConfig } from './authjs.config.js';

import type * as AuthjsPerRouGuardType from './authjs-per-rou.guard.js';

let mockSessionResult: any = null;

jest.unstable_mockModule('./get-session.js', () => ({
  getSession: jest.fn(async () => mockSessionResult),
}));

const { AuthjsPerRouGuard } = await import('./authjs-per-rou.guard.js');

describe('AuthjsPerRouGuard', () => {
  let guard: AuthjsPerRouGuardType.AuthjsPerRouGuard;
  let config: AuthjsConfig;
  let injector: Injector;
  let reqCtx: RequestContext;

  beforeEach(() => {
    config = new AuthjsConfig();
    injector = {} as Injector;
    guard = new AuthjsPerRouGuard(config, injector);
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
  });

  it('sets session on reqCtx and returns true when session exists', async () => {
    const fakeSession = { user: { name: 'Jane' }, expires: '2030-01-01' };
    mockSessionResult = fakeSession;

    const result = await guard.canActivate(reqCtx);

    expect(result).toBe(true);
    expect(reqCtx.auth).toEqual(fakeSession);
  });
});
