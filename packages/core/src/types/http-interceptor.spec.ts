import { jest } from '@jest/globals';

import { HTTP_INTERCEPTORS } from '#constans';
import { Injector } from '#di';
import { ChainMaker } from '#services/chain-maker.js';
import { defaultProvidersPerApp } from '#services/default-providers-per-app.js';
import { defaultProvidersPerReq } from '#services/default-providers-per-req.js';
import { HttpBackend, HttpFrontend, HttpHandler, HttpInterceptor } from './http-interceptor.js';
import { ServiceProvider } from './mix.js';
import { RouteMeta } from './route-data.js';

describe('HttpInterceptor', () => {
  const jestFn = jest.fn((interceptorName: string) => interceptorName);

  class Interceptor1 implements HttpInterceptor {
    intercept(next: HttpHandler) {
      jestFn('Interceptor1');
      return next.handle();
    }
  }

  class Interceptor2 implements HttpInterceptor {
    intercept(next: HttpHandler) {
      jestFn('Interceptor2');
      return next.handle();
    }
  }

  class MockHttpFrontend implements HttpFrontend {
    intercept(next: HttpHandler) {
      jestFn('HttpFrontend');
      return next.handle();
    }
  }

  class MockHttpBackend implements HttpHandler {
    handle() {
      jestFn('HttpBackend');
      return Promise.resolve();
    }
  }

  const defaultProviders: ServiceProvider[] = [...defaultProvidersPerApp, ...defaultProvidersPerReq];

  beforeEach(() => {
    jestFn.mockRestore();
  });

  it('each interceptor calls next.handle()', () => {
    class Interceptor3 implements HttpInterceptor {
      intercept(next: HttpHandler) {
        jestFn('Interceptor3');
        return next.handle();
      }
    }

    const injector = Injector.resolveAndCreate([
      ...defaultProviders,
      { token: HttpFrontend, useClass: MockHttpFrontend },
      { token: HttpBackend, useClass: MockHttpBackend },
      { token: HTTP_INTERCEPTORS, useClass: Interceptor1, multi: true },
      { token: HTTP_INTERCEPTORS, useClass: Interceptor2, multi: true },
      { token: HTTP_INTERCEPTORS, useClass: Interceptor3, multi: true },
    ]);

    const chainMaker = injector.get(ChainMaker) as ChainMaker;
    const chain = chainMaker.makeChain({ nodeReq: {} as any, nodeRes: {} as any, aPathParams: [], queryString: '' });
    chain.handle();
    expect(jestFn.mock.calls).toEqual([
      ['HttpFrontend'],
      ['Interceptor1'],
      ['Interceptor2'],
      ['Interceptor3'],
      ['HttpBackend'],
    ]);
  });

  it('last interceptor run without calls next.handle()', () => {
    class Interceptor3 implements HttpInterceptor {
      intercept() {
        jestFn('Interceptor3');
        return Promise.resolve();
      }
    }

    const injector = Injector.resolveAndCreate([RouteMeta]).resolveAndCreateChild([
      ...defaultProviders,
      { token: HttpFrontend, useClass: MockHttpFrontend },
      { token: HTTP_INTERCEPTORS, useClass: Interceptor1, multi: true },
      { token: HTTP_INTERCEPTORS, useClass: Interceptor2, multi: true },
      { token: HTTP_INTERCEPTORS, useClass: Interceptor3, multi: true },
    ]);

    const chainMaker = injector.get(ChainMaker) as ChainMaker;
    const chain = chainMaker.makeChain({ nodeReq: {} as any, nodeRes: {} as any, aPathParams: [], queryString: '' });
    chain.handle();
    expect(jestFn.mock.calls).toEqual([['HttpFrontend'], ['Interceptor1'], ['Interceptor2'], ['Interceptor3']]);
  });

  it('without HTTP_INTERCEPTORS, chain should be HttpBackend', () => {
    const injector = Injector.resolveAndCreate([RouteMeta]).resolveAndCreateChild([...defaultProviders]);

    const chainMaker = injector.get(ChainMaker) as ChainMaker;
    const chain = chainMaker.makeChain({ nodeReq: {} as any, nodeRes: {} as any, aPathParams: [], queryString: '' });
    const frontend = injector.get(HttpFrontend) as HttpFrontend;
    const backend = injector.get(HttpBackend) as HttpBackend;
    expect((chain as any).interceptor).toBe(frontend);
    expect((chain as any).next).toBe(backend);
  });
});
