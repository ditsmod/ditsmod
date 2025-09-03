import { AnyObj, Class, DecoratorAndValue } from '@ditsmod/core';

import { trpcRoute } from '#decorators/trpc-route.js';
import { HttpInterceptor } from '#interceptors/tokens-and-types.js';
import { Http2SecureServerOptions, ServerOptions } from './server-options.js';
import { controller, ControllerRawMetadata } from '#decorators/controller.js';

export function isCtrlDecor(decoratorAndValue?: AnyObj): decoratorAndValue is DecoratorAndValue<ControllerRawMetadata> {
  return decoratorAndValue?.decorator === controller;
}

export function isRoute<T>(decoratorAndValue?: DecoratorAndValue<T>): decoratorAndValue is DecoratorAndValue<T> {
  return (decoratorAndValue as DecoratorAndValue<T>)?.decorator === trpcRoute;
}

export function isInterceptor(cls?: Class): cls is Class<HttpInterceptor> {
  return typeof (cls?.prototype as HttpInterceptor | undefined)?.intercept == 'function';
}

export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}
