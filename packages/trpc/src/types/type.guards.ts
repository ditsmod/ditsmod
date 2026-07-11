import type { AnyObj, Class, DecoratorMeta } from '@ditsmod/core';

import { trpcRoute } from '#decorators/trpc-route.js';
import type { TrpcHttpInterceptor } from '#interceptors/tokens-and-types.js';
import type { Http2SecureServerOptions, ServerOptions } from './server-options.js';
import type { ControllerOptions } from '#decorators/trpc-controller.js';
import { trpcController } from '#decorators/trpc-controller.js';

export function isControllerDecorator(decoratorMeta?: AnyObj): decoratorMeta is DecoratorMeta<ControllerOptions> {
  return decoratorMeta?.decorator === trpcController;
}

export function isInterceptor(cls?: Class): cls is Class<TrpcHttpInterceptor> {
  return typeof (cls?.prototype as TrpcHttpInterceptor | undefined)?.intercept == 'function';
}

export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}

export function isTrpcRoute<T>(decoratorMeta?: DecoratorMeta<T>): decoratorMeta is DecoratorMeta<T> {
  return (decoratorMeta as DecoratorMeta<T>)?.decorator === trpcRoute;
}
