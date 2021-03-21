import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';

import { HttpBackend, HttpHandler, HttpInterceptorsChain, HttpInterceptor, HTTP_INTERCEPTORS, HttpFrontend } from './http-interceptor';
import { Request } from '../services/request';
import { defaultProvidersPerReq } from '../services/default-providers-per-req';
import { defaultProvidersPerApp } from '../services/default-providers-per-app';

describe('HttpInterceptor', () => {
  const jestFn = jest.fn((interceptorName: string) => interceptorName);

  class Interceptor1 implements HttpInterceptor {
    intercept(req: Request, next: HttpHandler) {
      jestFn('Interceptor1');
      return next.handle(req);
    }
  }

  class Interceptor2 implements HttpInterceptor {
    intercept(req: Request, next: HttpHandler) {
      jestFn('Interceptor2');
      return next.handle(req);
    }
  }

  class MockHttpFrontend implements HttpFrontend {
    intercept(req: Request, next: HttpHandler) {
      jestFn('HttpFrontend');
      return next.handle(req);
    }
  }

  class MockHttpBackend implements HttpHandler {
    handle(req: Request) {
      jestFn('HttpBackend');
      return Promise.resolve(req);
    }
  }

  let chain: HttpHandler;

  beforeEach(() => {
    jestFn.mockRestore();
  });

  it('each interceptor calls next.handle()', () => {
    class Interceptor3 implements HttpInterceptor {
      intercept(req: Request, next: HttpHandler) {
        jestFn('Interceptor3');
        return next.handle(req);
      }
    }

    const injector = ReflectiveInjector.resolveAndCreate([
      ...defaultProvidersPerApp,
      ...defaultProvidersPerReq,
      HttpInterceptorsChain,
      { provide: HttpFrontend, useClass: MockHttpFrontend },
      { provide: HttpBackend, useClass: MockHttpBackend },
      { provide: HTTP_INTERCEPTORS, useClass: Interceptor1, multi: true },
      { provide: HTTP_INTERCEPTORS, useClass: Interceptor2, multi: true },
      { provide: HTTP_INTERCEPTORS, useClass: Interceptor3, multi: true },
    ]);
    const httpInterceptorsChain = injector.get(HttpInterceptorsChain) as HttpInterceptorsChain;
    chain = httpInterceptorsChain.getChain();

    chain.handle({} as Request);
    expect(jestFn.mock.calls).toEqual([['HttpFrontend'], ['Interceptor1'], ['Interceptor2'], ['Interceptor3'], ['HttpBackend']]);
  });

  it('last interceptor run without calls next.handle()', () => {
    class Interceptor3 implements HttpInterceptor {
      intercept(req: Request) {
        jestFn('Interceptor3');
        return Promise.resolve(req);
      }
    }

    const injector = ReflectiveInjector.resolveAndCreate([
      ...defaultProvidersPerApp,
      ...defaultProvidersPerReq,
      { provide: HttpFrontend, useClass: MockHttpFrontend },
      { provide: HTTP_INTERCEPTORS, useClass: Interceptor1, multi: true },
      { provide: HTTP_INTERCEPTORS, useClass: Interceptor2, multi: true },
      { provide: HTTP_INTERCEPTORS, useClass: Interceptor3, multi: true },
    ]);
    const httpInterceptorsChain = injector.get(HttpInterceptorsChain) as HttpInterceptorsChain;
    chain = httpInterceptorsChain.getChain();

    chain.handle({} as Request);
    expect(jestFn.mock.calls).toEqual([['HttpFrontend'], ['Interceptor1'], ['Interceptor2'], ['Interceptor3']]);
  });

  it('without HTTP_INTERCEPTORS, chain should be HttpBackend', () => {
    const injector = ReflectiveInjector.resolveAndCreate([
      ...defaultProvidersPerApp,
      ...defaultProvidersPerReq
    ]);
    const httpInterceptorsChain = injector.get(HttpInterceptorsChain) as HttpInterceptorsChain;
    chain = httpInterceptorsChain.getChain();
    const frontend = injector.get(HttpFrontend) as HttpFrontend;
    const backend = injector.get(HttpBackend) as HttpBackend;
    expect((chain as any).interceptor).toBe(frontend);
    expect((chain as any).next).toBe(backend);
  });
});
