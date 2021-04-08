import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';

import { HttpBackend, HttpHandler, HttpInterceptor, HTTP_INTERCEPTORS, HttpFrontend } from './http-interceptor';
import { defaultProvidersPerReq } from '../services/default-providers-per-req';
import { defaultProvidersPerApp } from '../services/default-providers-per-app';
import { NodeReqToken, NodeResToken } from './server-options';
import { ServiceProvider } from './mix';
import { RouteMeta } from './route-data';
import { PATH_PARAMS, QUERY_STRING } from './router';

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

  const defaultProviders: ServiceProvider[] = [
    ...defaultProvidersPerApp,
    ...defaultProvidersPerReq,
    { provide: NodeReqToken, useValue: {} },
    { provide: NodeResToken, useValue: {} },
    { provide: RouteMeta, useValue: {} },
    { provide: PATH_PARAMS, useValue: [] },
    { provide: QUERY_STRING, useValue: {} },
  ];

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

    const injector = ReflectiveInjector.resolveAndCreate([
      ...defaultProviders,
      { provide: HttpFrontend, useClass: MockHttpFrontend },
      { provide: HttpBackend, useClass: MockHttpBackend },
      { provide: HTTP_INTERCEPTORS, useClass: Interceptor1, multi: true },
      { provide: HTTP_INTERCEPTORS, useClass: Interceptor2, multi: true },
      { provide: HTTP_INTERCEPTORS, useClass: Interceptor3, multi: true },
    ]);

    const chain = injector.get(HttpHandler) as HttpHandler;
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

    const injector = ReflectiveInjector.resolveAndCreate([
      ...defaultProviders,
      { provide: HttpFrontend, useClass: MockHttpFrontend },
      { provide: HTTP_INTERCEPTORS, useClass: Interceptor1, multi: true },
      { provide: HTTP_INTERCEPTORS, useClass: Interceptor2, multi: true },
      { provide: HTTP_INTERCEPTORS, useClass: Interceptor3, multi: true },
    ]);

    const chain = injector.get(HttpHandler) as HttpHandler;
    chain.handle();
    expect(jestFn.mock.calls).toEqual([['HttpFrontend'], ['Interceptor1'], ['Interceptor2'], ['Interceptor3']]);
  });

  it('without HTTP_INTERCEPTORS, chain should be HttpBackend', () => {
    const injector = ReflectiveInjector.resolveAndCreate([...defaultProviders]);

    const chain = injector.get(HttpHandler) as HttpHandler;
    const frontend = injector.get(HttpFrontend) as HttpFrontend;
    const backend = injector.get(HttpBackend) as HttpBackend;
    expect((chain as any).frontend).toBe(frontend);
    expect((chain as any).backend).toBe(backend);
  });
});
