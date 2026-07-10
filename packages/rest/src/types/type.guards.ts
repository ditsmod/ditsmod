import type { AnyObj, Class, DecoratorMeta, ModRefId } from '@ditsmod/core';

import { route } from '#decorators/route.js';
import type { HttpInterceptor } from '#interceptors/tokens-and-types.js';
import type { AppendsWithOptions, RestModuleOptions } from '#init/rest-init-raw-meta.js';
import type { ControllerDecoratorOptions } from './controller.js';
import { controller } from './controller.js';
import type { Http2SecureServerOptions, ServerOptions } from './server-options.js';

export function isCtrlDecor(decoratorMeta?: AnyObj): decoratorMeta is DecoratorMeta<ControllerDecoratorOptions> {
  return decoratorMeta?.decorator === controller;
}

export function isRoute<T>(decoratorMeta?: DecoratorMeta<T>): decoratorMeta is DecoratorMeta<T> {
  return (decoratorMeta as DecoratorMeta<T>)?.decorator === route;
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
