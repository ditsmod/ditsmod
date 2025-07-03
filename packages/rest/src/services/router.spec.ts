import { Injector } from '@ditsmod/core';

import { DefaultRouter } from './router.js';
import { Fn } from '../types/types.js';
import { Tree } from './tree.js';
import { RoutingErrorMediator } from './router-error-mediator.js';

describe('Router', () => {
  const noop: Fn = () => {};
  let injector: Injector;

  beforeEach(() => {
    injector = Injector.resolveAndCreate([
      Tree,
      DefaultRouter,
      {token: RoutingErrorMediator, useValue: {}}
    ]);
  });

  it('injector instanceof Injector', () => {
    expect(injector).toBeTruthy();
  });

  it('throws with invalid input', () => {
    const router = injector.get(DefaultRouter) as DefaultRouter;
    expect(() => router.on('GET', 'invalid', noop)).toThrow();
  });

  it('support `get`', () => {
    const router = injector.get(DefaultRouter) as DefaultRouter;
    router.on('GET', '/', noop);
    expect(router.find('GET', '/').handle).toBeTruthy();
  });

  it('support `post`', () => {
    const router = injector.get(DefaultRouter) as DefaultRouter;
    router.on('POST', '/', noop);
    expect(router.find('POST', '/').handle).toBeTruthy();
  });

  it('support `put`', () => {
    const router = injector.get(DefaultRouter) as DefaultRouter;
    router.on('PUT', '/', noop);
    expect(router.find('PUT', '/').handle).toBeTruthy();
  });

  it('support `delete`', () => {
    const router = injector.get(DefaultRouter) as DefaultRouter;
    router.on('DELETE', '/', noop);
    expect(router.find('DELETE', '/').handle).toBeTruthy();
  });

  it('support `head`', () => {
    const router = injector.get(DefaultRouter) as DefaultRouter;
    router.on('HEAD', '/', noop);
    expect(router.find('HEAD', '/').handle).toBeTruthy();
  });

  it('support `patch`', () => {
    const router = injector.get(DefaultRouter) as DefaultRouter;
    router.on('PATCH', '/', noop);
    expect(router.find('PATCH', '/').handle).toBeTruthy();
  });

  it('support `options`', () => {
    const router = injector.get(DefaultRouter) as DefaultRouter;
    router.on('OPTIONS', '/', noop);
    expect(router.find('OPTIONS', '/').handle).toBeTruthy();
  });

  it('support `trace`', () => {
    const router = injector.get(DefaultRouter) as DefaultRouter;
    router.on('TRACE', '/', noop);
    expect(router.find('TRACE', '/').handle).toBeTruthy();
  });

  it('support `connect`', () => {
    const router = injector.get(DefaultRouter) as DefaultRouter;
    router.on('CONNECT', '/', noop);
    expect(router.find('CONNECT', '/').handle).toBeTruthy();
  });

  it('support wildcard `all`', () => {
    const router = injector.get(DefaultRouter) as DefaultRouter;
    router.all('/', noop);
    expect(router.find('DELETE', '/').handle).toBeTruthy();
    expect(router.find('GET', '/').handle).toBeTruthy();
    expect(router.find('HEAD', '/').handle).toBeTruthy();
    expect(router.find('PATCH', '/').handle).toBeTruthy();
    expect(router.find('POST', '/').handle).toBeTruthy();
    expect(router.find('PUT', '/').handle).toBeTruthy();
    expect(router.find('OPTIONS', '/').handle).toBeTruthy();
    expect(router.find('TRACE', '/').handle).toBeTruthy();
    expect(router.find('CONNECT', '/').handle).toBeTruthy();
  });
});
