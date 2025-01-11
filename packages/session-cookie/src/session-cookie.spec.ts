import { Injector } from '@ditsmod/core';
import { RawRequest, RawResponse, RAW_REQ, RAW_RES } from '@ditsmod/routing';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

import { SessionCookie } from './session-cookie.js';
import { SessionCookieOptions } from './types.js';

describe('@ditsmod/session-cookie', () => {
  const setHeader = vi.fn();
  let rawReq: RawRequest;
  let rawRes: RawResponse;
  let session: SessionCookie;
  const config = new SessionCookieOptions();
  config.cookieName = 'session';
  config.maxAge = 1000 * 3600 * 24 * 30; // 30 days;

  beforeEach(() => {
    rawReq = { headers: { cookie: '' } } as RawRequest;
    rawRes = {
      getHeader: (): any => {},
      setHeader,
      writeHead: (): any => {},
    } as unknown as RawResponse;

    const injector = Injector.resolveAndCreate([
      { token: SessionCookieOptions, useValue: config },
      { token: RAW_REQ, useValue: rawReq },
      { token: RAW_RES, useValue: rawRes },
      SessionCookie,
    ]);
    session = injector.get(SessionCookie);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns instanceof Session', async () => {
    expect(session instanceof SessionCookie).toBe(true);
  });

  it('session.id is string by default', async () => {
    expect(session.id).toBe('');
  });

  it('session config setted properly', async () => {
    expect((session as any).opts).toEqual({ cookieName: config.cookieName, maxAge: config.maxAge });
  });

  it('session stores and retrieves values properly', async () => {
    session.id = 'bar';
    expect(session.id).toBe('bar');
  });

  it('set variables and clear them yields no variables', async () => {
    session.id = 'bar';
    session.setMaxAge(0);
    expect(session.id).toBe('');
  });

  it('includes cookie headers', async () => {
    session.id = 'foobar';
    rawRes.writeHead(200);
    expect(setHeader).toHaveBeenCalledTimes(1);
    expect(setHeader).toHaveBeenCalledWith('Set-Cookie', expect.arrayContaining([expect.stringMatching(/session=foobar; path=\/;/)]));
    expect(setHeader).toHaveBeenCalledWith('Set-Cookie', expect.arrayContaining([expect.stringMatching(/httponly/)]));
  });

  it('set maxAge before setting session.id', async () => {
    const maxAge = 1000 * 60 * 60 * 3;
    session.setMaxAge(maxAge);
    session.id = 'foobar';
    rawRes.writeHead(200);
    expect(setHeader).toHaveBeenCalledTimes(1);
    expect(setHeader).toHaveBeenCalledWith('Set-Cookie', expect.arrayContaining([expect.stringMatching(/session=foobar; path=\/;/)]));
    expect(setHeader).toHaveBeenCalledWith('Set-Cookie', expect.arrayContaining([expect.stringMatching(/httponly/)]));
  });

  it('set maxAge after setting session.id', async () => {
    session.id = 'foobar';
    const maxAge = 1000 * 60 * 60 * 3;
    session.setMaxAge(maxAge);
    rawRes.writeHead(200);
    expect(setHeader).toHaveBeenCalledTimes(1);
    expect(setHeader).toHaveBeenCalledWith('Set-Cookie', expect.arrayContaining([expect.stringMatching(/session=foobar; path=\/;/)]));
    expect(setHeader).toHaveBeenCalledWith('Set-Cookie', expect.arrayContaining([expect.stringMatching(/httponly/)]));
  });
});
