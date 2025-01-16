import { AnyObj, Class, DecoratorAndValue, ModuleType, ModuleWithParams } from '@ditsmod/core';

import { route } from '../decorators/route.js';
import { HttpInterceptor } from '#interceptors/tokens-and-types.js';
import { AppendsWithParams } from '../module/module-metadata.js';
import { controller, ControllerRawMetadata } from './controller.js';
import { Http2SecureServerOptions, ServerOptions } from './server-options.js';


export function isCtrlDecor(decoratorAndValue?: AnyObj): decoratorAndValue is DecoratorAndValue<ControllerRawMetadata> {
  return decoratorAndValue?.decorator === controller;
}

export function isRoute<T>(decoratorAndValue?: DecoratorAndValue<T>): decoratorAndValue is DecoratorAndValue<T> {
  return (decoratorAndValue as DecoratorAndValue<T>)?.decorator === route;
}

export function isInterceptor(cls?: Class): cls is Class<HttpInterceptor> {
  return typeof (cls?.prototype as HttpInterceptor | undefined)?.intercept == 'function';
}

export function isAppendsWithParams(
  modRefId?: ModuleType | ModuleWithParams | AppendsWithParams,
): modRefId is AppendsWithParams {
  return (
    (modRefId as AppendsWithParams)?.module !== undefined &&
    ((modRefId as AppendsWithParams)?.path !== undefined || (modRefId as AppendsWithParams)?.absolutePath !== undefined)
  );
}


export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}
