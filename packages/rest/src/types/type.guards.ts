import type { AnyObj, Class, DecoratorAndValue, ModRefId } from '@ditsmod/core';

import { route } from '#decorators/route.js';
import type { HttpInterceptor } from '#interceptors/tokens-and-types.js';
import type { AppendsWithOptions, RestModuleOptions } from '#init/rest-init-raw-meta.js';
import type { ControllerDecoratorOptions } from './controller.js';
import { controller } from './controller.js';
import type { Http2SecureServerOptions, ServerOptions } from './server-options.js';

export function isCtrlDecor(
  decoratorAndValue?: AnyObj,
): decoratorAndValue is DecoratorAndValue<ControllerDecoratorOptions> {
  return decoratorAndValue?.decorator === controller;
}

export function isRoute<T>(decoratorAndValue?: DecoratorAndValue<T>): decoratorAndValue is DecoratorAndValue<T> {
  return (decoratorAndValue as DecoratorAndValue<T>)?.decorator === route;
}

export function isInterceptor(cls?: Class): cls is Class<HttpInterceptor> {
  return typeof (cls?.prototype as HttpInterceptor | undefined)?.intercept == 'function';
}

export function isAppendsWithOptions(
  modRefId?: ModRefId | RestModuleOptions | AppendsWithOptions,
): modRefId is AppendsWithOptions {
  return (
    (modRefId as AppendsWithOptions)?.module !== undefined &&
    ((modRefId as AppendsWithOptions)?.path !== undefined ||
      (modRefId as AppendsWithOptions)?.absolutePath !== undefined)
  );
}

export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}
