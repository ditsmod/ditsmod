import 'reflect-metadata';
import { NodeRequest, NodeResponse } from '@ts-stack/cookies';
import { ReflectiveInjector } from '@ts-stack/di';
import { Logger, NODE_REQ, NODE_RES } from '@ditsmod/core';

import { SessionCookie } from './session-cookie';
import { SessionCookieOptions } from './types';

describe('@ditsmod/session-cookie', () => {
  const setHeaderMock = jest.fn<void, [string[]]>(() => {});
  let req: NodeRequest;
  let res: NodeResponse;
  let session: SessionCookie;

  beforeEach(() => {
    req = { headers: { cookie: '' } } as NodeRequest;
    res = {
      getHeader: (): any => {},
      setHeader: (headerName: string, headerValue: string[]): any => {
        setHeaderMock(headerValue);
      },
      writeHead: (): any => {},
    } as unknown as NodeResponse;
    const injector = ReflectiveInjector.resolveAndCreate([
      { provide: NODE_REQ, useValue: req },
      { provide: NODE_RES, useValue: res },
      Logger,
      SessionCookieOptions,
      SessionCookie,
    ]);
    session = injector.get(SessionCookie);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns instanceof Session', async () => {
    expect(session instanceof SessionCookie).toBe(true);
  });

  it('session.id is string by default', async () => {
    expect(session.id).toBe('');
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
    res.writeHead(200);
    const calls = setHeaderMock.mock.calls;
    expect(calls.length).toBe(1);
    const cookie = calls[0][0][0];
    expect(/foobar/.test(cookie)).toBe(true);
    expect(/expires/.test(cookie)).toBe(true);
    expect(/path/.test(cookie)).toBe(true);
    expect(/httponly/.test(cookie)).toBe(true);
  });

  it('set maxAge before setting session.id', async () => {
    const maxAge = 1000 * 60 * 60 * 3;
    session.setMaxAge(maxAge);
    session.id = 'foobar';
    res.writeHead(200);
    const calls = setHeaderMock.mock.calls;
    expect(calls.length).toBe(1);
    const cookie = calls[0][0][0];
    expect(/foobar/.test(cookie)).toBe(true);
    expect(/expires/.test(cookie)).toBe(true);
    expect(/path/.test(cookie)).toBe(true);
    expect(/httponly/.test(cookie)).toBe(true);
  });

  it('set maxAge after setting session.id', async () => {
    session.id = 'foobar';
    const maxAge = 1000 * 60 * 60 * 3;
    session.setMaxAge(maxAge);
    res.writeHead(200);
    const calls = setHeaderMock.mock.calls;
    expect(calls.length).toBe(1);
    const cookie = calls[0][0][0];
    expect(/foobar/.test(cookie)).toBe(true);
    expect(/expires/.test(cookie)).toBe(true);
    expect(/path/.test(cookie)).toBe(true);
    expect(/httponly/.test(cookie)).toBe(true);
  });
});
